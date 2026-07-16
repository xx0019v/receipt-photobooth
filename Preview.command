#!/bin/zsh

set -u

ROOT="/Users/exx/receipt-photobooth"
LABEL="jp.xx0019v.receipt-photobooth-preview"
PLIST_SOURCE="$ROOT/scripts/$LABEL.plist"
PLIST_TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"
URL="http://localhost:3090"

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
cp "$PLIST_SOURCE" "$PLIST_TARGET"
chmod +x "$ROOT/scripts/preview-daemon.sh"

launchctl bootout "gui/$UID/$LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$UID" "$PLIST_TARGET"
launchctl enable "gui/$UID/$LABEL"
launchctl kickstart -k "gui/$UID/$LABEL"

print "▲ THE RECEIPT production preview"
print "  GitHubの最新版を確認し、production buildを起動しています。"

for _ in {1..180}; do
  if curl -fsS -o /dev/null "$URL"; then
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
  sleep 1
done

print "✗ 起動を確認できませんでした。"
print "ログ: $HOME/Library/Logs/receipt-photobooth-preview-error.log"
read "?Enterで閉じます"
exit 1
