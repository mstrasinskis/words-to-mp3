#!/usr/bin/env bash
set -euo pipefail

shopt -s nullglob

for f in output/*.mp3; do
  tmp="${f%.mp3}.tmp.mp3"

  ffmpeg -y -i "$f" -af "apad=pad_dur=1" -c:a libmp3lame "$tmp"
  mv -f -- "$tmp" "$f"
done
