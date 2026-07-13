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

# 最新版を取得（git リポジトリのときだけ・失敗しても続行）
if [ -d .git ]; then
  echo "• GitHub から最新を取得中..."
  git pull --ff-only 2>&1 | sed 's/^/    /' || \
    echo "    （ローカルに変更あり → 自動取得スキップ。今あるコードで起動）"
fi

# 依存関係（初回 or package.json 更新時）
if [ ! -d node_modules ]; then
  echo "• 初回セットアップ: npm install ..."
  npm install || { echo "✗ install 失敗"; read "?Enter で閉じます"; exit 1; }
fi

URL="http://localhost:3080"

# 既に別ウィンドウで起動中なら、その最新を開くだけ
if curl -s -o /dev/null "$URL"; then
  echo "• 既に起動中のサーバーを開きます ($URL)"
  open "$URL"
  echo "  ※最新コードを反映するには、古い起動ウィンドウを閉じてから開き直してください。"
  read "?Enter で閉じます"
  exit 0
fi

# サーバーが立ち上がったらブラウザを開く
( for i in {1..60}; do
    if curl -s -o /dev/null "$URL"; then open "$URL"; break; fi
    sleep 0.5
  done ) &

echo "• 起動中... 数秒でブラウザが開きます ($URL)"
echo "  縦型フル表示は、ブラウザで F11（全画面）+ ウィンドウを縦長に。"
npm run dev -- -p 3080
