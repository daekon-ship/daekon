#!/usr/bin/env bash
# Higgsfield-export → weboldal-kész hero videók (Kalocsa GeoWorks látványterv)
# Használat: bash _forras/video.sh <fekvo_16x9.mp4>
# Kimenet: video/hero-scrub.mp4 (asztali, görgetésre pörgetett, sűrű kulcskockák),
#          video/hero-loop-mobil.mp4 (mobil, ~1,2:1 kivágás, a végén áttűnés az első kockába → varrat nélküli hurok),
#          video/hero-poster.webp, video/hero-poster-mobil.webp
set -euo pipefail
IN="$1"
cd "$(dirname "$0")/.."
mkdir -p video
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
# 1) asztali scrub: eredeti felbontás (max. 1920), hang nélkül, 4 kockánként kulcskocka, B-kocka nélkül
ffmpeg -y -v error -i "$IN" -an -vf "scale='min(1920,iw)':-2:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 27 -g 4 -keyint_min 4 -bf 0 -sc_threshold 0 -movflags +faststart video/hero-scrub.mp4
# 2) mobil hurok: 1,2:1 kivágás (kanál + fülke), a végén 0,6 mp áttűnés az első kockába
OFF=$(python3 -c "print(max(0,$DUR-0.7))")
ffmpeg -y -v error -i "$IN" -i "$IN" -filter_complex \
 "[0:v]crop=ih*1.2:ih:iw*0.15:0,scale=768:640:flags=lanczos,fps=24,format=yuv420p,setpts=PTS-STARTPTS[a];
  [1:v]crop=ih*1.2:ih:iw*0.15:0,scale=768:640:flags=lanczos,fps=24,format=yuv420p,trim=end_frame=1,loop=loop=30:size=1:start=0,setpts=N/24/TB[b];
  [a][b]xfade=transition=fade:duration=0.6:offset=$OFF,trim=duration=$(python3 -c "print($OFF+0.6)"),format=yuv420p[v]" \
  -map "[v]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -preset slow -crf 27 -g 48 -movflags +faststart video/hero-loop-mobil.mp4
# FIGYELEM: csak yuv420p (4:2:0)! A 4:4:4 („High 4:4:4 Predictive”) H.264-et az iPhone/Android hardveres dekóderek nem játsszák le.
# 3) poszterek (első kocka)
ffmpeg -y -v error -i "$IN" -frames:v 1 -vf "scale='min(1920,iw)':-2" -q:v 82 video/hero-poster.webp
ffmpeg -y -v error -i "$IN" -frames:v 1 -vf "crop=ih*1.2:ih:iw*0.15:0,scale=768:640" -q:v 82 video/hero-poster-mobil.webp
ls -lh video/
