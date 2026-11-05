#!/bin/bash
# Двойной клик — запускает игру во весь экран в отдельном окне Chrome.
cd "$(dirname "$0")"
PORT=8765
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  SERVER=$!
  sleep 1
fi
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --user-data-dir="$HOME/.helicopter-base-chrome" \
  --autoplay-policy=no-user-gesture-required \
  --no-first-run --start-fullscreen \
  "http://localhost:$PORT/"
[ -n "$SERVER" ] && kill $SERVER
