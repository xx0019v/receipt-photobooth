#!/bin/zsh
# ダブルクリックで THE RECEIPT キオスクをプレビュー起動します。
# 開発サーバーを立ち上げ、ブラウザで縦型キオスク画面を開きます。
# 止めるときはこのターミナルウィンドウを閉じるか Ctrl+C。

cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:$PATH"

echo "▲ THE RECEIPT — preview"
echo "  作業ディレクトリ: $(pwd)"

# Node の確認
if ! command -v npm >/dev/null 2>&1; then
  echo "✗ npm が見つかりません。'brew install node' を実行してください。"
  read "?Enter で閉じます"
  exit 1
fi

# 依存関係（初回のみ）
if [ ! -d node_modules ]; then
  echo "• 初回セットアップ: npm install ..."
  npm install || { echo "✗ install 失敗"; read "?Enter で閉じます"; exit 1; }
fi

URL="http://localhost:3080"

# サーバーが立ち上がったらブラウザを開く
( for i in {1..40}; do
    if curl -s -o /dev/null "$URL"; then open "$URL"; break; fi
    sleep 0.5
  done ) &

echo "• 起動中... 数秒でブラウザが開きます ($URL)"
echo "  縦型フル表示は、ブラウザで F11（全画面）+ ウィンドウを縦長に。"
npm run dev
