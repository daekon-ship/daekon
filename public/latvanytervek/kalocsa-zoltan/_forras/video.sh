#!/usr/bin/env bash
# Higgsfield-export → weboldal-kész hero videók (Kalocsa GeoWorks látványterv)
# Használat: bash _forras/video.sh <fekvo_16x9.mp4> [allo_mobil.mp4]
# Kimenet: video/hero-scrub-1920.mp4 (görgetéshez, sűrű kulcskockák), video/hero-loop-720.mp4 (mobil, 4:5), video/hero-poster.webp
set -euo pipefail
IN="$1"; MOB="${2:-}"
cd "$(dirname "$0")/.."
mkdir -p video
# 1) asztali, görgetésre pörgetett változat: 1920 széles, hang nélkül, 4 kockánként kulcskocka, B-kockák nélkül
ffmpeg -y -v error -i "$IN" -an -vf "scale=1920:-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 27 -g 4 -keyint_min 4 -bf 0 -sc_threshold 0 -movflags +faststart video/hero-scrub-1920.mp4
# 2) mobil hurok: külön álló export, vagy a fekvőből 4:5 kivágás (gép a jobb oldalon)
if [ -n "$MOB" ]; then SRC="$MOB"; VF="scale=720:900:force_original_aspect_ratio=increase,crop=720:900"
else SRC="$IN"; VF="crop=ih*4/5:ih:iw-ow-iw*0.06:0,scale=720:900:flags=lanczos"; fi
ffmpeg -y -v error -i "$SRC" -an -vf "$VF,format=yuv420p" \
  -c:v libx264 -preset slow -crf 29 -g 48 -movflags +faststart video/hero-loop-720.mp4
# 3) poszter (első kocka)
ffmpeg -y -v error -i "$IN" -vf "scale=1600:-2" -frames:v 1 -q:v 80 video/hero-poster.webp
ls -lh video/
echo "Kész. kalocsa.js → HERO_VIDEO: mp4:'video/hero-scrub-1920.mp4', mobileMp4:'video/hero-loop-720.mp4', poster:'video/hero-poster.webp'"
