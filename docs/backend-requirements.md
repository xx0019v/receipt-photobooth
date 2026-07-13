# THE RECEIPT — バックエンド技術要件定義

対象: Raspberry Pi 5 上で動作するフォトブース・バックエンド。既存の Next.js キオスク UI（`app/`）に対して、カメラ撮影・レシート印刷・セッション管理を提供する。

## 1. システム構成

```
┌─────────────────────────── Raspberry Pi 5 (Bookworm 64bit) ───────────────────────────┐
│                                                                                        │
│  Chromium (kiosk, 1080×1920 portrait)                                                  │
│    └─ Next.js UI (localhost:3000)                                                      │
│         │  HTTP / MJPEG (localhost:8000)                                               │
│         ▼                                                                              │
│  booth-backend (Python / FastAPI / uvicorn, systemd 常駐)                              │
│    ├─ CameraDriver   ── Picamera2 (libcamera) ── Camera Module 3                       │
│    ├─ PrinterDriver  ── python-escpos (USB)   ── サーマルレシートプリンター            │
│    └─ ReceiptRenderer ─ Pillow(合成・二値化) + qrcode                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- フロントとバックエンドは同一機で完結。ネットワーク不要（QR 用 URL を除く）。
- バックエンドは **localhost バインドのみ**（`127.0.0.1:8000`）。外部公開しない。

## 2. ハードウェア前提

| 項目 | 採用（想定） | 備考 |
|---|---|---|
| SBC | Raspberry Pi 5 (4GB+) | Bookworm 64bit |
| カメラ | Raspberry Pi Camera Module 3 | libcamera / Picamera2 経由。USB UVC カメラも Driver 差し替えで対応可 |
| プリンター | GDMicroelectronics micro-printer（USB `28e9:0289`・確定） | 58mm/384dot・カッター無し。usblp (`/dev/usb/lp0`) 経由で制御。**別電源必須**（§8.5） |
| モニター | 縦 1080×1920 タッチ | UI 側で対応済み |

ハード固有部は **Driver インターフェースで抽象化**し、実機がなくても開発できるよう **Mock ドライバー**を必ず用意する（macOS 開発環境向け）。

## 3. ソフトウェアスタック

- Python 3.11+（Bookworm 標準）
- FastAPI + uvicorn — API サーバー
- Picamera2 — カメラ（apt: `python3-picamera2`。venv は `--system-site-packages` で作成）
- python-escpos — ESC/POS ラスター印字（USB: pyusb + udev rule）
- Pillow — レシート画像合成・グレースケール・Floyd–Steinberg ディザ
- qrcode — DONE 画面 / レシート末尾の QR

## 4. API 契約（フロントエンド連携）

Base: `http://127.0.0.1:8000`

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/health` | `{status, camera, printer}` — 起動確認・ハード疎通 |
| GET | `/api/preview.mjpg` | MJPEG ライブプレビュー（`<img src>` で表示、multipart/x-mixed-replace） |
| POST | `/api/sessions` | セッション開始。`{session_id, serial}` を返す（serial はバックエンドが採番） |
| POST | `/api/sessions/{id}/capture` | 静止画 1 枚撮影。`{frame_id, url}` を返す（3 回呼ぶ） |
| GET | `/api/frames/{frame_id}.jpg` | 撮影フレーム取得（REVIEW 画面表示用） |
| POST | `/api/sessions/{id}/print` | 印刷ジョブ投入。body: `{style: "pass"\|"cover", scent: {...}, quote: {...}}`（UI の選択内容。省略時はデフォルト）。`{job_id}` を返す |
| GET | `/api/print-jobs/{job_id}` | `{state: queued|rendering|printing|done|error, progress, message}` |

設計方針:

- **serial の採番はバックエンドに移す**（現在は `app/lib/edition.ts` の `serialNo()` でフロント採番。印字物とセッションログの一意性を保証するため）。
- CAPTURE 画面のカウントダウンはフロント主導のまま。0 になった瞬間に `capture` を叩く。撮影レイテンシ目標 < 500ms。
- PRINTING 画面は固定 5.2 秒アニメーションをやめ、`print-jobs` のポーリング（500ms 間隔）で実進捗に同期する。
- 印刷完了後のフレーム/セッションはディスクに保存（イベント後の retention は要決定。デフォルト: 当日分のみ保持）。

## 5. 機能要件

### 5.1 カメラ
- ライブプレビュー: 640×480〜1024×768 / 15fps 以上の MJPEG。UI の表示枠は 920×1040(≒3:4 縦) なので **3:4 でクロップ**して配信。
- 静止画: 1536×2048 (3:4) 以上で撮影し JPEG 保存。プレビューと同一パイプラインで露出を安定させる。

### 5.2 レシート合成（ReceiptRenderer）
- 出力幅: プリンター解像度に一致（384 or 576 dot）。
- 構成（UI の `ReceiptStrip` を印字で再現）: マストヘッド "THE RECEIPT" / 号数・日付 / 写真 3 枚（ディザ済み）/ serial / QR / フッター。
- 写真は グレースケール → オートコントラスト → Floyd–Steinberg で二値化。
- レンダリング結果は PNG でも保存する（デバッグ・モック印刷出力を兼ねる）。

### 5.3 印刷
- python-escpos のラスターイメージ印字 + フルカット（カッター有無は設定制御）。
- ジョブは直列キュー（同時 1 件）。ジョブ状態は上記 API で公開。
- プリンター未接続・用紙切れは `error` として UI に返し、バックエンドはクラッシュしない。

### 5.4 セッション管理
- インメモリ + ディスク永続（`data/sessions/{serial}/frame-1.jpg …`）。
- タイムアウト: 最終操作から 10 分で自動クローズ。

### 5.5 モックモード（開発用）
- `BOOTH_MOCK=1`（または個別に `CAMERA_DRIVER=mock` / `PRINTER_DRIVER=mock`）。
- MockCamera: 合成画像（番号入りダミーポートレート）を配信・撮影。
- MockPrinter: 印字せずレンダリング PNG を `data/prints/` に書き出し、印刷時間をシミュレート。
- これにより macOS 上で全フロー（UI 込み）が動作すること。

## 6. 非機能要件

- 起動: systemd で自動起動、クラッシュ時 restart=always。UI より先に healthy になること。
- レイテンシ: capture < 500ms / レシートレンダリング < 2s / 印刷開始まで < 1s。
- 連続稼働: イベント 1 日（8h）で劣化なし。フレームリーク・fd リーク監視。
- ログ: journald へ構造化ログ（セッション ID・ジョブ ID 付き）。
- セキュリティ: localhost バインド、CORS は `http://localhost:3000` のみ許可。

## 7. デプロイ（Pi 5）

- `deploy/booth-backend.service` — systemd unit（venv の uvicorn を起動）
- `deploy/99-escpos.rules` — USB プリンターの udev rule（plugdev 権限）
- Chromium kiosk 起動は既存 README の手順に統合。

## 8. 検証計画（実機）

1. `libcamera-hello` → Picamera2 でプレビュー/静止画が取れること
2. `lsusb` でプリンター VID/PID 確認 → udev rule 適用 → python-escpos でテスト印字
3. ディザ品質: 実写を 384/576dot で印字し、コントラスト調整値を決める
4. 全フロー通し（UI → capture ×3 → print → 排紙）を 10 回連続
5. 異常系: プリンター電源断 / 用紙切れ / カメラケーブル抜けで UI にエラーが返り、復旧後に再開できること

## 8.5 電源要件（実機検証で確定）

- **Pi 5 とサーマルプリンターの電源系統は分離必須**。プリンターは専用 AC アダプタで駆動し、USB はデータ通信のみに使う。
- 実測 2026-07-13: プリンター電源投入と同時に Pi がダウンする事象を確認（USB バスパワー吸い込みによるブラウンアウトの疑い）。印字ヘッドは瞬間 2〜3A 級で Pi の USB 供給能力（合計 1.6A）を超えるため、バスパワー駆動は不可。
- Pi 5 は公式 27W (5V/5A) USB-C 電源を使用する。

## 9. 未決事項（要ハード確定）

- [x] プリンター確定: GDMicroelectronics micro-printer（`28e9:0289` / 58mm / 384dot / カッター無し / usblp 経由）— 2026-07-13 実機で印字確認
- [x] カメラ確定: Raspberry Pi Camera Module 3（imx708）— 2026-07-13 実機で撮影確認（capture 157ms）
- [ ] QR の遷移先 URL（画像配布ページを作るか、固定 URL か）
- [ ] 撮影データの保持期間・持ち帰り方法
