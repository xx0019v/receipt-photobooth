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

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
```

### バックエンド（カメラ・プリンター）

`backend/` に FastAPI バックエンドがある。モックドライバーで macOS でも全フローが動く:

```bash
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
BOOTH_MOCK=1 .venv/bin/uvicorn booth.main:app --port 8000
```

UI はバックエンドを自動検出する（未起動ならモック表示のまま動作）。要件定義は `docs/backend-requirements.md`、セットアップ詳細は `backend/README.md`。

### Raspberry Pi キオスク運用（後日）

Chromium を kiosk モードで起動し、`npm run build && npm run start` した本体を全画面表示する。

## ステータス

- [x] リポジトリ初期化
- [x] モニター UI/UX デザイン（全7フェーズ実装・静的ビルド確認済み）
- [x] バックエンド実装（FastAPI + カメラ/プリンタードライバー、モックで E2E 確認済み）
- [x] カメラ連携（Pi 5 + Camera Module 3 実機で検証済み。capture 157ms）
- [x] サーマルプリンター連携（GD micro-printer 実機でレシート印字成功。2026-07-13）
- [ ] Pi でのキオスク起動（Node インストール → next build → Chromium kiosk + systemd 常駐化）

### 実装メモ

- 画面は固定 1080×1920 の `Stage` を画面サイズにスケールして表示（実機・プレビュー共通）
- 状態マシンは `app/kiosk/KioskApp.tsx`、各画面は `app/kiosk/screens/`
- フォント: Bodoni Moda（ディスプレイ）/ Inter（UI）/ Space Mono（レシート）
