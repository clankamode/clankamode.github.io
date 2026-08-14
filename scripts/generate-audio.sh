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

# Reject empty/JSON error bodies left behind by older silent failures.
is_audio_payload() {
  local path="$1"
  python3 - "$path" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
if not path.is_file() or path.stat().st_size <= 0:
    raise SystemExit(1)

data = path.read_bytes()[:64]
# TTS APIs often write JSON error objects when curl ignores HTTP status.
if data.lstrip()[:1] in (b"{", b"["):
    raise SystemExit(1)
# ID3v2 tag or MPEG frame sync.
if data.startswith(b"ID3"):
    raise SystemExit(0)
if len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0:
    raise SystemExit(0)
raise SystemExit(1)
PY
}

if [ -f "$OUTFILE" ]; then
  if is_audio_payload "$OUTFILE"; then
    echo "SKIP: $SLUG (already exists)"; exit 0
  fi
  echo "WARN: removing corrupt existing audio for $SLUG" >&2
  rm -f "$OUTFILE"
fi

mkdir -p "$AUDIO_DIR"

TEXT=$(python3 "$SCRIPT_DIR/extract-text.py" "$POST")
CHUNK_SIZE=4000
TEXT_LEN=${#TEXT}

generate_chunk() {
  local input_text="$1"
  local output_file="$2"
  local http_code

  http_code=$(
    python3 -c "
import json, sys
text = sys.stdin.read()
payload = {'model':'gpt-4o-mini-tts','input':text,'voice':'ash','response_format':'mp3','speed':1.0}
sys.stdout.buffer.write(json.dumps(payload).encode())
" <<< "$input_text" | \
      curl -sS -o "$output_file" -w "%{http_code}" \
        https://api.openai.com/v1/audio/speech \
        -H "Authorization: Bearer $OPENAI_API_KEY" \
        -H "Content-Type: application/json" \
        -d @-
  )

  if [ "$http_code" != "200" ]; then
    rm -f "$output_file"
    echo "Error: OpenAI TTS failed for $SLUG (HTTP $http_code)" >&2
    exit 1
  fi

  if ! is_audio_payload "$output_file"; then
    rm -f "$output_file"
    echo "Error: OpenAI TTS returned non-audio payload for $SLUG" >&2
    exit 1
  fi
}

if [ "$TEXT_LEN" -le "$CHUNK_SIZE" ]; then
  echo "  $SLUG ($TEXT_LEN chars, 1 chunk)..."
  generate_chunk "$TEXT" "$OUTFILE"
else
  CHUNKS=$(( (TEXT_LEN + CHUNK_SIZE - 1) / CHUNK_SIZE ))
  echo "  $SLUG ($TEXT_LEN chars, ~$CHUNKS chunks)..."
  TMPDIR=$(mktemp -d)
  trap 'rm -rf "$TMPDIR"' EXIT
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
    ffmpeg -y -f concat -safe 0 -i "$TMPDIR/filelist.txt" -c copy "$OUTFILE"
  else
    cat "$TMPDIR"/chunk-*.mp3 > "$OUTFILE"
  fi

  if ! is_audio_payload "$OUTFILE"; then
    rm -f "$OUTFILE"
    echo "Error: concatenated audio payload is not valid for $SLUG" >&2
    exit 1
  fi

  rm -rf "$TMPDIR"
  trap - EXIT
fi

FILESIZE=$(stat -f%z "$OUTFILE" 2>/dev/null || stat -c%s "$OUTFILE" 2>/dev/null)
echo "  Done: $OUTFILE ($(( FILESIZE / 1024 ))KB)"
