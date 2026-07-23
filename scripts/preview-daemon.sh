#!/bin/zsh

set -u

ROOT="/Users/exx/receipt-photobooth"
# Branch the preview mirrors. `main` is production: the preview always shows
# what has actually shipped. Point this at a feature branch only while that
# branch is being reviewed, and put it back to `main` when it merges.
BRANCH="main"
PORT="3090"
CHECK_SECONDS="60"
SERVER_PID=""
# Commit the running preview was actually built from, so Preview.command can
# tell "latest" from "stale" instead of trusting an HTTP 200.
HEAD_STAMP="$ROOT/.preview-head"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NEXT_TELEMETRY_DISABLED=1

cd "$ROOT" || exit 1

log() {
  print -r -- "$(date '+%Y-%m-%d %H:%M:%S')  $*"
}

stop_server() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""

  # A server from a previous run — or a manual `next start` — can survive and
  # keep holding this port. It answers HTTP 200 from an in-memory manifest of
  # an OLD build while `.next` is replaced underneath it, so the HTML points at
  # chunk hashes that no longer exist on disk and the page renders blank.
  # Always clear the port before rebuilding.
  local stale
  stale="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$stale" ]]; then
    log "Clearing stale listener(s) on ${PORT}: ${stale//$'\n'/ }"
    print -r -- "$stale" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

cleanup() {
  stop_server
}

shutdown() {
  cleanup
  exit 0
}

tracked_tree_is_clean() {
  git diff --quiet && git diff --cached --quiet
}

sync_latest() {
  git fetch --quiet origin "$BRANCH" || {
    log "GitHub fetch failed; keeping the current local revision."
    return 1
  }

  if ! tracked_tree_is_clean; then
    log "Tracked working-tree changes detected; automatic fast-forward skipped."
    return 1
  fi

  # Follow the tracked branch explicitly. Without this the daemon builds
  # whichever branch happens to be checked out, so the preview can silently
  # mirror something other than the branch under review. Only runs when the
  # tracked tree is clean, so no local work is discarded (untracked files are
  # preserved by checkout).
  if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]]; then
    log "Switching preview checkout to $BRANCH."
    git checkout --quiet "$BRANCH" 2>/dev/null \
      || git checkout --quiet -b "$BRANCH" --track "origin/$BRANCH" 2>/dev/null \
      || {
        log "Could not switch to $BRANCH; keeping the current branch."
        return 1
      }
  fi

  git merge --ff-only "origin/$BRANCH" >/dev/null || {
    log "Fast-forward failed; keeping the current local revision."
    return 1
  }
}

ensure_dependencies() {
  if [[ ! -d node_modules ]]; then
    log "Installing dependencies."
    npm install || return 1
  fi
}

build_and_start() {
  stop_server
  log "Building production preview at $(git rev-parse --short HEAD)."
  rm -rf .next
  npm run build || {
    log "Production build failed. The service will retry in ${CHECK_SECONDS}s."
    return 1
  }

  log "Starting http://0.0.0.0:${PORT}."
  npx next start -H 0.0.0.0 -p "$PORT" &
  SERVER_PID=$!
  sleep 1

  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log "Preview server failed to start."
    SERVER_PID=""
    rm -f "$HEAD_STAMP"
    return 1
  fi

  print -r -- "$(git rev-parse HEAD)" > "$HEAD_STAMP"
  log "Preview ready at $(git rev-parse --short HEAD) ($BRANCH)."
}

trap cleanup EXIT
trap shutdown INT TERM HUP

ensure_dependencies || exit 1
sync_latest || true
build_and_start || true
LAST_BUILT_HEAD="$(git rev-parse HEAD)"

while true; do
  sleep "$CHECK_SECONDS"

  if [[ -z "$SERVER_PID" ]] || ! kill -0 "$SERVER_PID" 2>/dev/null; then
    log "Preview is not running; rebuilding."
    sync_latest || true
    build_and_start || true
    LAST_BUILT_HEAD="$(git rev-parse HEAD)"
    continue
  fi

  git fetch --quiet origin "$BRANCH" || continue
  REMOTE_HEAD="$(git rev-parse "origin/$BRANCH")"
  if [[ "$REMOTE_HEAD" == "$LAST_BUILT_HEAD" ]]; then
    continue
  fi

  if ! tracked_tree_is_clean; then
    log "New GitHub revision found, but tracked local changes are present; update postponed."
    continue
  fi

  if git merge --ff-only "origin/$BRANCH" >/dev/null; then
    build_and_start || true
    LAST_BUILT_HEAD="$(git rev-parse HEAD)"
  fi
done
