#!/usr/bin/env bash
set -euo pipefail

for file in ./output/*.mp3; do
  [ -e "$file" ] || continue

  tmp="${file}.tmp.mp3"
  ffmpeg -y -i "$file" -q:a 4 "$tmp" && mv "$tmp" "$file"
done