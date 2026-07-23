#!/bin/zsh

set -u

ROOT="/Users/exx/receipt-photobooth"
LABEL="jp.xx0019v.receipt-photobooth-preview"
PLIST_SOURCE="$ROOT/scripts/$LABEL.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"
URL="http://localhost:3090"
# Must match BRANCH in scripts/preview-daemon.sh.
BRANCH="main"
HEAD_STAMP="$ROOT/.preview-head"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
chmod +x "$ROOT/scripts/preview-daemon.sh"

print "▲ THE RECEIPT production preview"
print "  GitHubの最新版($BRANCH)をproduction buildで開きます。"

# A running server is not proof that it serves the latest build. Two ways it
# lies: (1) a survivor process keeps answering 200 from an old in-memory
# manifest whose chunk hashes no longer exist on disk — the page loads blank;
# (2) the build is healthy but predates the newest commit on GitHub.
preview_is_current() {
  local served
  served="$(curl -fs "$URL" 2>/dev/null | grep -oE 'page-[a-f0-9]+\.js' | head -1)"
  [[ -n "$served" && -f "$ROOT/.next/static/chunks/app/$served" ]] || return 1

  # Offline: a self-consistent build is the best available answer.
  git -C "$ROOT" fetch --quiet origin "$BRANCH" 2>/dev/null || return 0

  local built remote
  built="$(cat "$HEAD_STAMP" 2>/dev/null || true)"
  remote="$(git -C "$ROOT" rev-parse "origin/$BRANCH" 2>/dev/null || true)"
  [[ -n "$built" && -n "$remote" && "$built" == "$remote" ]]
}

announce_and_exit() {
  local ip built
  ip="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  built="$(git -C "$ROOT" rev-parse --short "$(cat "$HEAD_STAMP" 2>/dev/null || print HEAD)" 2>/dev/null || print '?')"
  open "$URL"
  print ""
  print "✓ 最新previewを開きました: $URL"
  print "✓ 表示中のcommit: $built ($BRANCH)"
  if [[ -n "$ip" ]]; then
    print "✓ 同じWi-FiのPC: http://${ip}:3090"
  fi
  print "✓ GitHub更新確認: 約60秒ごと"
  read "?Enterで閉じます"
  exit 0
}

# Healthy AND current: open immediately, no restart (avoids downtime and
# duplicate builds).
if curl -fs -o /dev/null "$URL" 2>/dev/null && preview_is_current; then
  announce_and_exit
fi

if curl -fs -o /dev/null "$URL" 2>/dev/null; then
  print "  previewは起動していますが最新ではありません。再buildします…"
fi

# Install on first use. If the service is already loaded but currently
# building or recovering, kickstart without -k so the active build survives.
if ! launchctl print "gui/$UID/$LABEL" >/dev/null 2>&1; then
  cp "$PLIST_SOURCE" "$PLIST_TARGET"
  launchctl bootstrap "gui/$UID" "$PLIST_TARGET"
  launchctl enable "gui/$UID/$LABEL"
else
  launchctl kickstart -k "gui/$UID/$LABEL" >/dev/null 2>&1 || true
fi

print "  初回または更新build中です。少しお待ちください…"

for i in {1..300}; do
  if curl -fs -o /dev/null "$URL" 2>/dev/null && preview_is_current; then
    print ""
    print "✓ Macログイン時に自動起動"
    print "ログ: $HOME/Library/Logs/receipt-photobooth-preview.log"
    announce_and_exit
  fi
  if (( i % 10 == 0 )); then
    print "  … production buildを続行中 (${i}秒)"
  fi
  sleep 1
done

print "✗ 最新buildの起動を確認できませんでした。"
print "ログ: $HOME/Library/Logs/receipt-photobooth-preview-error.log"
read "?Enterで閉じます"
exit 1
