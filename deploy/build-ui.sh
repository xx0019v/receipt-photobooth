#!/bin/sh
set -eu

# NEXT_PUBLIC_* values are compiled into the static bundle. Building without
# these values is not a recoverable runtime configuration change: the Pi
# would silently run the laptop/mock policy. Keep the production build
# explicit and reproducible.
cd /home/chuo/receipt-photobooth
NEXT_PUBLIC_BOOTH_MODE=hardware \
NEXT_PUBLIC_BOOTH_API=http://127.0.0.1:8000 \
NEXT_PUBLIC_ENABLE_INSPECTOR=0 \
npm ci
NEXT_PUBLIC_BOOTH_MODE=hardware \
NEXT_PUBLIC_BOOTH_API=http://127.0.0.1:8000 \
NEXT_PUBLIC_ENABLE_INSPECTOR=0 \
npm run build

test -f ui-dist/index.html
