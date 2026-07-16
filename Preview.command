#!/bin/zsh

set -u

ROOT="/Users/exx/receipt-photobooth"
LABEL="jp.xx0019v.receipt-photobooth-preview"
PLIST_SOURCE="$ROOT/scripts/$LABEL.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"
URL="http://localhost:3090"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
chmod +x "$ROOT/scripts/preview-daemon.sh"

print "▲ THE RECEIPT production preview"
print "  GitHubの最新版をproduction buildで開きます。"

# The resident service already polls GitHub. A healthy preview must open
# immediately; restarting it here would create downtime and duplicate builds.
if curl -fs -o /dev/null "$URL" 2>/dev/null; then
  LOCAL_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
  open "$URL"
  print ""
  print "✓ 最新previewを開きました: $URL"
  if [[ -n "$LOCAL_IP" ]]; then
    print "✓ 同じWi-FiのPC: http://${LOCAL_IP}:3090"
  fi
  print "✓ GitHub更新確認: 約60秒ごと"
  read "?Enterで閉じます"
  exit 0
fi

# Install on first use. If the service is already loaded but currently
# building or recovering, kickstart without -k so the active build survives.
if ! launchctl print "gui/$UID/$LABEL" >/dev/null 2>&1; then
  cp "$PLIST_SOURCE" "$PLIST_TARGET"
  launchctl bootstrap "gui/$UID" "$PLIST_TARGET"
  launchctl enable "gui/$UID/$LABEL"
else
  launchctl kickstart "gui/$UID/$LABEL" >/dev/null 2>&1 || true
fi

print "  初回または復旧build中です。少しお待ちください…"

for i in {1..180}; do
  if curl -fs -o /dev/null "$URL" 2>/dev/null; then
    LOCAL_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
    open "$URL"
    print ""
    print "✓ このMac: $URL"
    if [[ -n "$LOCAL_IP" ]]; then
      print "✓ 同じWi-FiのPC: http://${LOCAL_IP}:3090"
    fi
    print "✓ GitHub更新確認: 約60秒ごと"
    print "✓ Macログイン時に自動起動"
    print ""
    print "ログ: $HOME/Library/Logs/receipt-photobooth-preview.log"
    read "?Enterで閉じます"
    exit 0
  fi
  if (( i % 10 == 0 )); then
    print "  … production buildを続行中 (${i}秒)"
  fi
  sleep 1
done

print "✗ 起動を確認できませんでした。"
print "ログ: $HOME/Library/Logs/receipt-photobooth-preview-error.log"
read "?Enterで閉じます"
exit 1
