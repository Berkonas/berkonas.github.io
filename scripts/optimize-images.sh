#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_ROOT="$ROOT_DIR/assets"
OUT_ROOT="$ASSET_ROOT/optimized"
MAX_DIMENSION="${1:-1800}"
# 82 keeps JPEG blocking out of sight on 1x and 1.25x Windows/Android screens,
# where each image pixel is shown larger than on a Retina display.
QUALITY="${2:-82}"
# Sizes are the LONGEST side (sips -Z). script.js turns them into true widths
# with IMAGE_DIMENSIONS, so paste the list printed at the end into it.
RESPONSIVE_SIZES=("${3:-480}" "${4:-720}" "${5:-960}" "${6:-1440}")

if ! command -v sips >/dev/null 2>&1; then
  echo "sips is required but was not found."
  exit 1
fi

mkdir -p "$OUT_ROOT"

count=0
while IFS= read -r -d '' src; do
  rel="${src#"$ASSET_ROOT/"}"
  rel_no_ext="${rel%.*}"
  dst="$OUT_ROOT/${rel_no_ext}.jpg"
  mkdir -p "$(dirname "$dst")"

  sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAX_DIMENSION" "$src" --out "$dst" >/dev/null

  for width in "${RESPONSIVE_SIZES[@]}"; do
    responsive_dst="$OUT_ROOT/${rel_no_ext}-${width}.jpg"
    sips -s format jpeg -s formatOptions "$QUALITY" -Z "$width" "$src" --out "$responsive_dst" >/dev/null
  done

  count=$((count + 1))
done < <(find "$ASSET_ROOT" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) ! -path "$OUT_ROOT/*" -print0)

echo "Optimized files created: $count"
echo
echo "IMAGE_DIMENSIONS for script.js:"
while IFS= read -r -d '' img; do
  key="${img#"$OUT_ROOT/"}"
  key="${key%.jpg}"
  [[ "$key" =~ -[0-9]+$ ]] && continue
  w=$(sips -g pixelWidth "$img" | awk '/pixelWidth/ {print $2}')
  h=$(sips -g pixelHeight "$img" | awk '/pixelHeight/ {print $2}')
  echo "  \"$key\": [$w, $h],"
done < <(find "$OUT_ROOT" -type f -name "*.jpg" -print0 | sort -z)
du -sh "$OUT_ROOT"
