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

### Raspberry Pi キオスク運用（後日）

Chromium を kiosk モードで起動し、`npm run build && npm run start` した本体を全画面表示する。

## ステータス

- [x] リポジトリ初期化
- [ ] モニター UI/UX デザイン（← いまここ）
- [ ] カメラ連携
- [ ] サーマルプリンター連携
- [ ] Raspberry Pi デプロイ
