#!/usr/bin/env bash
set -euo pipefail

POST="$1"
SLUG=$(basename "$POST" .html)
AUDIO_DIR="audio"
OUTFILE="$AUDIO_DIR/$SLUG.mp3"

if [ -z "${OPENAI_API_KEY:-}" ]; then
  echo "Error: OPENAI_API_KEY not set" >&2; exit 1
fi

if [ -f "$OUTFILE" ]; then
  echo "Audio already exists: $OUTFILE"; exit 0
fi

mkdir -p "$AUDIO_DIR"

TEXT=$(python3 << PYEOF
import re, html
with open('$POST') as f:
    content = f.read()
m = re.search(r'<div class="post-number">(.*?)<div class="footer">', content, re.DOTALL)
if not m:
    m = re.search(r'<h1>(.*?)<div class="footer">', content, re.DOTALL)
if not m:
    raise SystemExit('Could not extract post body')
body = m.group(1)
body = re.sub(r'<h[12][^>]*>(.*?)</h[12]>', r'\n\n\1.\n\n', body)
body = re.sub(r'</p>', '\n\n', body)
body = re.sub(r'<p[^>]*>', '', body)
body = re.sub(r'<div class="highlight">', '\n\n', body)
body = re.sub(r'</div>', '\n\n', body)
body = re.sub(r'<[^>]+>', '', body)
body = html.unescape(body)
body = re.sub(r'\n{3,}', '\n\n', body).strip()
print(body)
PYEOF
)

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
  echo "Generating audio ($TEXT_LEN chars)..."
  generate_chunk "$TEXT" "$OUTFILE"
else
  echo "Long post ($TEXT_LEN chars) — chunking..."
  TMPDIR=$(mktemp -d)
  CHUNK=""
  CHUNK_NUM=0

  while IFS= read -r line || [ -n "$line" ]; do
    if [ $(( ${#CHUNK} + ${#line} + 2 )) -gt "$CHUNK_SIZE" ] && [ -n "$CHUNK" ]; then
      CHUNK_NUM=$((CHUNK_NUM + 1))
      CHUNK_FILE="$TMPDIR/chunk-$(printf '%03d' $CHUNK_NUM).mp3"
      echo "  Chunk $CHUNK_NUM (${#CHUNK} chars)..."
      generate_chunk "$CHUNK" "$CHUNK_FILE"
      CHUNK=""
    fi
    CHUNK="${CHUNK}
${line}"
  done <<< "$TEXT"

  if [ -n "$CHUNK" ]; then
    CHUNK_NUM=$((CHUNK_NUM + 1))
    CHUNK_FILE="$TMPDIR/chunk-$(printf '%03d' $CHUNK_NUM).mp3"
    echo "  Chunk $CHUNK_NUM (${#CHUNK} chars)..."
    generate_chunk "$CHUNK" "$CHUNK_FILE"
  fi

  if command -v ffmpeg &>/dev/null; then
    echo "Concatenating $CHUNK_NUM chunks..."
    printf "file '%s'\n" "$TMPDIR"/chunk-*.mp3 > "$TMPDIR/filelist.txt"
    ffmpeg -y -f concat -safe 0 -i "$TMPDIR/filelist.txt" -c copy "$OUTFILE" 2>/dev/null
  else
    cat "$TMPDIR"/chunk-*.mp3 > "$OUTFILE"
  fi
  rm -rf "$TMPDIR"
fi

FILESIZE=$(stat -f%z "$OUTFILE" 2>/dev/null || stat -c%s "$OUTFILE" 2>/dev/null)
echo "Generated: $OUTFILE ($(( FILESIZE / 1024 ))KB)"
