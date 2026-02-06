#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_ROOT="$ROOT_DIR/assets"
OUT_ROOT="$ASSET_ROOT/optimized"
MAX_DIMENSION="${1:-1800}"
QUALITY="${2:-68}"

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
  count=$((count + 1))
done < <(find "$ASSET_ROOT" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) ! -path "$OUT_ROOT/*" -print0)

echo "Optimized files created: $count"
du -sh "$OUT_ROOT"
