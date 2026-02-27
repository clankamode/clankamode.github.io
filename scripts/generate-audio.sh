#!/usr/bin/env bash
set -euo pipefail

POST="$1"
SLUG=$(basename "$POST" .html)
AUDIO_DIR="audio"
OUTFILE="$AUDIO_DIR/$SLUG.mp3"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Error: OPENAI_API_KEY not set" >&2; exit 1
fi

if [ -f "$OUTFILE" ]; then
  echo "SKIP: $SLUG (already exists)"; exit 0
fi

mkdir -p "$AUDIO_DIR"

TEXT=$(python3 "$SCRIPT_DIR/extract-text.py" "$POST")
CHUNK_SIZE=4000
TEXT_LEN=${#TEXT}

generate_chunk() {
  local input_text="$1"
  local output_file="$2"
  python3 -c "
import json, sys
text = sys.stdin.read()
payload = {'model':'gpt-4o-mini-tts','input':text,'voice':'ash','response_format':'mp3','speed':1.0}
sys.stdout.buffer.write(json.dumps(payload).encode())
" <<< "$input_text" | \
  curl -s https://api.openai.com/v1/audio/speech \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @- \
    -o "$output_file"
}

if [ "$TEXT_LEN" -le "$CHUNK_SIZE" ]; then
  echo "  $SLUG ($TEXT_LEN chars, 1 chunk)..."
  generate_chunk "$TEXT" "$OUTFILE"
else
  CHUNKS=$(( (TEXT_LEN + CHUNK_SIZE - 1) / CHUNK_SIZE ))
  echo "  $SLUG ($TEXT_LEN chars, ~$CHUNKS chunks)..."
  TMPDIR=$(mktemp -d)
  CHUNK=""
  CHUNK_NUM=0

  while IFS= read -r line || [ -n "$line" ]; do
    if [ $(( ${#CHUNK} + ${#line} + 2 )) -gt "$CHUNK_SIZE" ] && [ -n "$CHUNK" ]; then
      CHUNK_NUM=$((CHUNK_NUM + 1))
      CHUNK_FILE="$TMPDIR/chunk-$(printf '%03d' $CHUNK_NUM).mp3"
      generate_chunk "$CHUNK" "$CHUNK_FILE"
      CHUNK=""
    fi
    CHUNK="${CHUNK}
${line}"
  done <<< "$TEXT"

  if [ -n "$CHUNK" ]; then
    CHUNK_NUM=$((CHUNK_NUM + 1))
    CHUNK_FILE="$TMPDIR/chunk-$(printf '%03d' $CHUNK_NUM).mp3"
    generate_chunk "$CHUNK" "$CHUNK_FILE"
  fi

  if command -v ffmpeg &>/dev/null; then
    printf "file '%s'\n" "$TMPDIR"/chunk-*.mp3 > "$TMPDIR/filelist.txt"
    ffmpeg -y -f concat -safe 0 -i "$TMPDIR/filelist.txt" -c copy "$OUTFILE" 2>/dev/null
  else
    cat "$TMPDIR"/chunk-*.mp3 > "$OUTFILE"
  fi
  rm -rf "$TMPDIR"
fi

FILESIZE=$(stat -f%z "$OUTFILE" 2>/dev/null || stat -c%s "$OUTFILE" 2>/dev/null)
echo "  Done: $OUTFILE ($(( FILESIZE / 1024 ))KB)"
