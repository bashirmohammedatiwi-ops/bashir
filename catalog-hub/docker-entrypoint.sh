#!/bin/sh
set -eu

mkdir -p /app/data

if [ -d /app/data-seed ]; then
  for f in /app/data-seed/*.json; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    if [ "$base" = "barcode-meta-cache.json" ] && [ -f "/app/data/$base" ]; then
      continue
    fi
    if [ ! -f "/app/data/$base" ]; then
      cp "$f" "/app/data/$base"
    fi
  done
fi

exec "$@"
