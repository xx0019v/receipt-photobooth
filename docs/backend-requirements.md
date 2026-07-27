# THE RECEIPT — バックエンド技術要件定義

対象: Raspberry Pi 5 上で動作するフォトブース・バックエンド。Next.js キオスク UI（`app/`）に対して、カメラ撮影・レシート印刷・セッション管理・写真配布を提供する。

**ステータス: 実装済み・実機検証済み（2026-07-13 / 2026-07-24）。** 本書は要件と実装済み仕様を兼ねる。

## 1. システム構成

```
┌─────────────────────────── Raspberry Pi 5 (Debian 13 trixie 64bit) ────────────────────┐
│                                                                                        │
│  Chromium kiosk (--incognito, Wayland/labwc, DSI 縦 270°)                              │
│    └─ 静的 UI (next build --output export, localhost:3000)                             │
│         │  HTTP / MJPEG (localhost:8000)                                               │
│         ▼                                                                              │
│  booth-backend (Python / FastAPI / uvicorn, systemd 常駐)                              │
│    ├─ CameraDriver   ── Picamera2 (libcamera) ── Camera Module 3 (imx708)              │
│    ├─ PrinterDriver  ── python-escpos ── usblp /dev/usb/lp0 ── GD micro-printer        │
│    └─ ReceiptRenderer ─ Pillow(2スタイル合成・F-Sディザ) + qrcode                      │
│                                                                                        │
│  /p/{serial} 配布ページ ←──(同一 LAN の来場者スマホが QR から到達)                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

- フロントとバックエンドは同一機で完結。UI は静的エクスポートなので **Pi に Node 不要**。
- バックエンドは `0.0.0.0:8000` バインド。**QR 配布ページを来場者スマホ（同一 LAN）に見せるため**で、イベント用の閉じた Wi-Fi での運用を前提とする。公衆ネットワークに晒さないこと。

## 2. ハードウェア構成（実機確定）

| 項目 | 確定 | 備考 |
|---|---|---|
| SBC | Raspberry Pi 5 | Debian 13 (trixie) 64bit / Python 3.13 |
| カメラ | Camera Module 3 (imx708) | Picamera2 経由。capture 実測 157ms |
| プリンター | GDMicroelectronics micro-printer（USB `28e9:0289`） | 58mm/384dot・カッター無し。usblp (`/dev/usb/lp0`, group `lp`) 経由。**別電源必須**（§8.5） |
| モニター | 7" DSI タッチ 800×480 | `wlr-randr --transform 270` で縦運用。UI の 1080×1920 Stage が自動スケール |

ハード固有部は Driver インターフェースで抽象化し、`BOOTH_MOCK=1` で macOS でも全フローが動く（Mock ドライバー）。

## 3. ソフトウェアスタック

- Python 3.13（trixie 標準）/ FastAPI + uvicorn
- Picamera2 — apt: `python3-picamera2`。venv は `--system-site-packages` で作成
- python-escpos — ラスター印字。**usblp デバイスノード経由（File ドライバー）**。pyusb はフォールバック
- Pillow — レシート合成・Floyd–Steinberg 二値化 / qrcode — 実 QR 生成

## 4. API 契約（実装済み）

Base: `http://127.0.0.1:8000`（UI から）/ `http://<Pi の LAN IP>:8000`（来場者スマホから）

| Method | Path | 説明 |
|---|---|---|
| GET | `/api/health` | `{status, camera, printer, drivers}` |
| GET | `/api/preview.mjpg` | MJPEG ライブプレビュー（構え画面・撮影画面の `<img src>`） |
| POST | `/api/sessions` | セッション開始。`{session_id, serial}`（serial はバックエンド採番 `YYYY-NNNN` 永続連番） |
| POST | `/api/sessions/{id}/capture` | 静止画 1 枚撮影。`{frame_id: "{serial}-{n}", url}` |
| GET | `/api/frames/{serial}-{n}.jpg` | 撮影フレーム取得（UI 表示・配布ページ共用） |
| POST | `/api/sessions/{id}/print` | 印刷ジョブ投入 → `{job_id}`。body `{style, scent, quote, frames, ...}` は**疎結合**: `style` は自由文字列（未知スタイルは既定レイアウトで印字 + message で通知）、`motif` 等の追加フィールドはそのまま renderer へ透過。`frames` は任意の **1-based インデックス配列（印刷順）**: 撮影した全フレームから印刷する部分集合と並び順を指定（例: 6 枚撮影 → `[5,2,3]` の 3 枚を印字）。省略時は全フレームを撮影順で印字、範囲外インデックスは 422。**同一セッションへの再 POST は冪等**（既存 job_id を返し二重印字しない。error 時のみ再試行可） |
| GET | `/api/print-jobs/{job_id}` | `{state: queued\|rendering\|printing\|done\|error, progress, message}` |
| GET | `/api/qr/{serial}.png` | 実 QR 画像（DONE 画面表示用。遷移先は下記配布ページ） |
| GET | `/p/{serial}` | **写真配布ページ**（写真 + レシート画像の閲覧・保存。QR の着地先） |
| GET | `/p/{serial}/receipt.png` | 印字したレシート画像 |

設計方針（実装済み）:

- serial 採番はバックエンド（フロントの `serialNo()` はオフライン時フォールバック専用）
- カウントダウンはフロント主導。フラッシュ開始と同時に `capture`（実測 157ms < 目標 500ms）
- 印刷画面は固定アニメではなく `print-jobs` ポーリング（400ms）で実進捗に同期
- **撮影枚数と印字枚数は分離**（現行 UI: 6 枚撮影 → 3 枚選択・並べ替え → `frames` で指定して印字）
- **Retake はセッションを作り直す**（フレーム番号を 1 起点にリセットするため。バックエンド側のセッションはフレームを蓄積し続ける）
- バックエンド不在時、UI は自動でモック表示にフォールバック（UI 単体デモ可能）

## 5. 機能要件（実装済み）

### 5.1 カメラ
- 1 本の video パイプラインで main（2048×1536 静止画用）+ lores（640×480 プレビュー）を同時取得。モード切替なしで露出が安定し、capture が速い
- どちらも中央 3:4 縦クロップ。プレビューは lores の Y プレーン（グレースケール — モノクロ UI と整合）
- 初期化は 4 回リトライ（プロセス再起動時のカメラ解放待ち競合対策）

### 5.2 レシート合成（2 スタイル・暫定リファレンス実装）

> **紙面デザインの所有権はフロントエンド側にある。** 以下のレイアウトは現行 UI（`ReceiptStrip` / `MagazineCover`）に合わせた**暫定のリファレンス実装**であり、固定仕様ではない。UI/紙面デザインの変更が確定した段階で、payload（style / scent / quote / motif / serial / 写真）を入力とする renderer をフロント側とすり合わせて差し替える前提。バックエンドが保証するのは API 契約（§4）とレンダリング〜印字パイプラインであり、寸法・配置・見た目ではない。
- **PASS**（`ReceiptStrip` 対応）: 横型ボーディングパス 1000×636 を横組みでレンダリング → **90° 回転して 384dot 幅へ縮小**（≒48×75mm）。写真 3 連 / NOW ✈ 行き先 / フレグランスノート / スタブ（GATE・SEAT・FLIGHT・バーコード・実 QR）
- **COVER**（`MagazineCover` 対応）: 引用カード 640×780 を縦のまま 384dot へ。グレー地はディザで網点化。quote は 4 タイポバリアント（serif / serif-italic / sans / sans-caps）+ 自動折返し
- 文字サイズは画面デザインより意図的に大きく（感熱 203dpi で最小 ~1.5mm を確保）
- 写真: グレースケール → オートコントラスト → 全面 Floyd–Steinberg。結果 PNG を `data/sessions/{serial}/receipt.png` に保存（配布ページで再利用）

### 5.3 印刷
- バンド分割（64dot）を実機速度に合わせて送信し、実進捗をコールバック → ジョブ状態に反映
- 紙面末尾に固定 96dot（12mm）の白ラスターを含める。プリンターの行間状態に依存する追加 feed は使わず、紙長を毎回固定
- 直列キュー（同時 1 件）。プリンター異常は `error` としてUIへ返し、バックエンドは落ちない
- フル印字実測 約 33 秒（58mm・レシート全長）

### 5.4 セッション管理
- インメモリ + ディスク永続（`data/sessions/{serial}/frame-N.jpg`, `receipt.png`）
- serial は `data/serial-counter` で年次リセットの永続連番。TTL 10 分で自動クローズ

### 5.5 配布ページ
- QR（印字物・DONE 画面共通）→ `http://<Pi>:8000/p/{serial}`。写真・レシートの表示と保存リンク
- serial 形式（`^\d{4}-\d{4}$`）検証 + パス正規化でディレクトリトラバーサル防止
- 制約: serial は連番なので他人のページも推測可能。閉じたイベント Wi-Fi 前提の割り切り（要件緩和する場合はトークン化）

### 5.6 モックモード（開発用）
- `BOOTH_MOCK=1` で camera / printer とも Mock。MockCamera は動く合成ポートレート、MockPrinter は PNG 書き出し + 印字時間シミュレート。macOS で UI 込み全フロー動作

## 6. 非機能要件

- systemd 常駐（restart=always）。カメラ初期化リトライで再起動競合に耐える
- レイテンシ実測: capture 157ms / レンダリング < 2s / 印字 33s（58mm フル）
- ログ: uvicorn + ジョブログ（serial・job id 付き）を journald へ
- セキュリティ: CORS は `localhost:3000` / `127.0.0.1:3000` のみ。`0.0.0.0` バインドは閉域 LAN 前提（§1）
- Chromium は `--incognito` — デプロイ後に古いバンドルがキャッシュに残らない

## 7. デプロイ（Pi 5, 実機構成）

- `deploy/booth-backend.service` — バックエンド（system unit, user=chuo, `SupplementaryGroups=lp video`）
- `deploy/booth-ui.service` — 静的 UI 配信（user unit, `python3 -m http.server 3000`）
- `deploy/booth-kiosk.service` — Chromium kiosk（user unit, Wayland + `--incognito`）
- `deploy/99-escpos.rules` — udev rule（`28e9:0289` → group `lp`）+ `usermod -aG lp chuo`
- `deploy/labwc/` — labwc 設定（`~/.config/labwc/` へ設置）。`autostart` が DSI-2 の 270° 回転、`rc.xml` がタッチデバイスの出力マッピング。**`mouseEmulation` は必ず `"no"`**: `"yes"`（RPi OS の設定ツールが書くことがある）だとタッチが全部マウスイベント化し、タップは効くのにスワイプスクロールが全滅する（2026-07-24 に実機で発生・修正）
- 起動時 env: `QR_BASE_URL=http://<Pi の LAN IP>:8000/p`（QR の着地先。未設定だとデフォルト URL になるので必ず設定）

## 8. 検証結果（2026-07-13 実機）

- [x] Picamera2 プレビュー / 静止画（画質・3:4 クロップ・色味 OK、capture 157ms）
- [x] usblp 経由の ESC/POS 印字（PASS レイアウトのフル印字 33s、レイアウト目視確認）
- [x] タッチパネルから UI 通し: scent → format → 構え（ライブ映像）→ 撮影 ×3 → 実印字 → DONE
- [x] 配布ページ / QR エンドポイント 200 応答
- [ ] 印字 10 回連続の耐久確認（イベント前に実施）
- [ ] 異常系: 印字中の用紙切れ / カメラケーブル抜け（イベント前に実施）
- [ ] スマホ実機での QR スキャン → 配布ページ表示（同一 Wi-Fi で確認）

### 追検証（2026-07-24, main の新 UI へ再配線後）

- [x] API 通し: session → 実カメラ capture ×2 → QR / 配布ページ 200 → `frames: [2,1]`（逆順指定）で実印字 done
- [x] `frames` 範囲外インデックスが 422 で拒否されること
- [x] booth-ui / booth-kiosk user unit を実機に設置・起動（UI :3000 / Chromium kiosk）
- [x] タッチスクロール不具合の原因特定と修正（labwc `mouseEmulation` — §7）

## 8.5 電源要件（実機検証で確定）

- **Pi 5 とサーマルプリンターの電源系統は分離必須**。プリンターは専用電源で駆動し、USB はデータ通信のみ。
- 実測 2026-07-13: プリンター電源投入と同時に Pi がダウン（USB バスパワー吸い込みによるブラウンアウトの疑い）。印字ヘッドは瞬間 2〜3A 級で Pi の USB 供給能力（合計 1.6A）を超える。
- Pi 5 は公式 27W (5V/5A) USB-C 電源を使用する。

## 8.6 本番前チェックリスト（実機で得た知見）

- [ ] プリンターの**蓋が完全に閉まっている**こと（開いていてもステータスは「正常」を返し、無反応になる）
- [ ] **感熱紙の裏表**（爪でこすって黒くなる面がヘッド側。逆だと白紙が出る）
- [ ] プリンター別電源 → プリンター → Pi の順に電源投入
- [ ] Pi・キオスク・来場者用 Wi-Fi が同一ネットワーク
- [ ] `QR_BASE_URL` が当日の Pi の IP になっている

## 9. 残課題

- [x] プリンター確定: GD micro-printer（`28e9:0289` / 58mm / カッター無し / usblp）
- [x] カメラ確定: Camera Module 3（imx708）
- [x] QR の遷移先: `/p/{serial}` 配布ページとして実装
- [ ] 撮影データの保持期間（デフォルト無期限。イベント後の消去運用を決める）
- [ ] 印字濃度・コントラストの最終チューニング（実写での見え方確認後）
- [ ] backend の systemd unit 本設置（booth-ui / booth-kiosk は 2026-07-24 設置済み。backend は手動起動のままなので `deploy/booth-backend.service` を設置する — Pi 再起動で backend だけ落ちる状態）
