#!/bin/zsh

set -u

ROOT="/Users/exx/receipt-photobooth"
BRANCH="ui/editorial-print-engine"
PORT="3090"
CHECK_SECONDS="60"
SERVER_PID=""

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
    return 1
  fi

  log "Preview ready at $(git rev-parse --short HEAD)."
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
