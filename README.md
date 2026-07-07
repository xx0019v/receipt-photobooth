# THE RECEIPT — Photobooth Kiosk

イベント用の小型フォトブース（プリ機）。撮影した写真を**サーマルレシートプリンター**でレシート風にプリントする。香水自動販売機のとなりに設置する想定。

## 構成

- **UI**: Next.js + React + Tailwind（Chromium キオスクモードで全画面表示）
- **画面**: 縦型モニター 1080 × 1920（ポートレート）
- **ハード**: Raspberry Pi + タッチスクリーンモニター + カメラ + サーマルレシートプリンター
- **デザイン**: ラグジュアリー・モノクロのエディトリアル路線

## 画面フロー

```
① IDLE      アトラクト画面（TAP TO BEGIN）
② INTRO     使い方・ポーズ案内
③ POSE      カウントダウン 3-2-1
④ CAPTURE   撮影
⑤ REVIEW    プレビュー（撮り直し / プリント）
⑥ PRINTING  レシート出力アニメーション
⑦ DONE      お礼画面 + QR
```

## PC でプレビュー（いつでも確認）

**いちばん簡単**: プロジェクト内の **`Preview.command` をダブルクリック**。
開発サーバーが起動し、数秒でブラウザが `http://localhost:3080` を開きます。
- 縦型キオスク表示: ブラウザで **F11（全画面）**＋ウィンドウを縦長に。画面は自動で 1080×1920 にスケールします。
- 止めるとき: 開いたターミナルを閉じるか `Ctrl+C`。

**コマンドで起動する場合**:

```bash
npm install      # 初回のみ
npm run dev      # http://localhost:3080
```

### Raspberry Pi キオスク運用（後日）

Chromium を kiosk モードで起動し、`npm run build && npm run start` した本体を全画面表示する。

## ステータス

- [x] リポジトリ初期化
- [x] モニター UI/UX デザイン（全7フェーズ実装・静的ビルド確認済み）
- [ ] カメラ連携（`Portrait` プレースホルダーを実カメラ映像に差し替え）
- [ ] サーマルプリンター連携（`ReceiptStrip` を実際の印字データに）
- [ ] Raspberry Pi デプロイ（Chromium kiosk）

### 実装メモ

- 画面は固定 1080×1920 の `Stage` を画面サイズにスケールして表示（実機・プレビュー共通）
- 状態マシンは `app/kiosk/KioskApp.tsx`、各画面は `app/kiosk/screens/`
- フォント: Bodoni Moda（ディスプレイ）/ Inter（UI）/ Space Mono（レシート）
