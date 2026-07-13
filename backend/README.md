# booth-backend

THE RECEIPT のバックエンド（FastAPI）。カメラ撮影・レシート合成・サーマル印刷・セッション管理を提供する。要件と API 契約は [`docs/backend-requirements.md`](../docs/backend-requirements.md) を参照。

## 開発（macOS / モックドライバー）

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
BOOTH_MOCK=1 .venv/bin/uvicorn booth.main:app --port 8000
```

別ターミナルで `npm run dev` すると、キオスク UI が自動でバックエンドに接続する（未起動ならモック表示に自動フォールバック）。

テスト:

```bash
.venv/bin/python -m pytest tests
```

## Raspberry Pi 5 セットアップ

```bash
sudo apt install -y python3-picamera2 libcamera-apps
cd backend
python3 -m venv --system-site-packages .venv   # picamera2 は apt 由来
.venv/bin/pip install -r requirements.txt -r requirements-pi.txt

# プリンターの USB ID を確認して deploy/ の 2 ファイルに反映
lsusb

sudo cp ../deploy/99-escpos.rules /etc/udev/rules.d/
sudo udevadm control --reload && sudo udevadm trigger
sudo cp ../deploy/booth-backend.service /etc/systemd/system/
sudo systemctl enable --now booth-backend
```

## 環境変数

| 変数 | 既定値 | 説明 |
|---|---|---|
| `BOOTH_MOCK` | – | `1` で camera/printer とも強制モック |
| `CAMERA_DRIVER` | `mock` | `mock` / `picamera2` |
| `PRINTER_DRIVER` | `mock` | `mock` / `escpos` |
| `PRINTER_WIDTH_DOTS` | `384` | 58mm=384 / 80mm=576 |
| `PRINTER_USB_VENDOR` / `PRINTER_USB_PRODUCT` | `0x0416` / `0x5011` | `lsusb` の ID |
| `PRINTER_CUT` | `1` | オートカッターの有無 |
| `BOOTH_DATA_DIR` | `data` | フレーム・レシート・連番の保存先 |
| `QR_BASE_URL` | `https://the-receipt.studio/p` | レシート QR の先頭 URL（空で QR 無効） |

## 構成

```
booth/
  config.py    環境変数 → Settings
  camera.py    CameraDriver: MockCamera / Picamera2Camera（3:4 縦クロップ）
  printer.py   PrinterDriver: MockPrinter(PNG出力) / EscposPrinter(USB, バンド印字)
  receipt.py   ReceiptRenderer: UI の ReceiptStrip を 1bit 画像で再現（F-S ディザ）
  sessions.py  serial 採番（YYYY-NNNN 永続連番）+ フレーム保存 + TTL
  jobs.py      印刷ジョブキュー（直列 / queued→rendering→printing→done|error）
  main.py      FastAPI: health / preview.mjpg / sessions / capture / print
```
