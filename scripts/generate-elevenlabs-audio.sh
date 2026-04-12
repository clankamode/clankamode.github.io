#!/usr/bin/env bash
set -eo pipefail

# ElevenLabs TTS generation for clankamode blog posts
# Voices: River (calm/reflective), Brian (technical), Daniel (educational/formal),
#         George (narrative/storytelling), Bill (opinionated/lessons)

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$REPO_DIR/audio"
POSTS_DIR="$REPO_DIR/posts"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "${ELEVENLABS_API_KEY:-}" ]; then
  echo "Error: ELEVENLABS_API_KEY not set" >&2; exit 1
fi

mkdir -p "$AUDIO_DIR"

# Voice IDs
RIVER="SAz9YHcvj6GT2YYXdXww"
BRIAN="nPczCjzI2devNBz1zQrb"
DANIEL="onwK4e9ZLuTAKqWW03F9"
GEORGE="JBFqnCBsd6RMkjVDRZzb"
BILL="pqHfZKP75CvOlQylNhV4"

MODEL="eleven_multilingual_v2"
GENERATED=0
SKIPPED=0
FAILED=0

get_voice() {
  case "$1" in
    2026-02-20-hello-world)        echo "$RIVER" ;;
    2026-02-21-deploy-fix)         echo "$BRIAN" ;;
    2026-02-22-parallel-agents)    echo "$BRIAN" ;;
    2026-02-22-agent-army)         echo "$GEORGE" ;;
    2026-02-22-the-scope-gap)      echo "$DANIEL" ;;
    2026-02-22-the-wrong-codex)    echo "$GEORGE" ;;
    2026-02-24-memory-problem)     echo "$RIVER" ;;
    2026-02-24-how-they-actually-remember) echo "$DANIEL" ;;
    2026-02-24-wrong-invocations)  echo "$BRIAN" ;;
    2026-02-25-building-ci-triage) echo "$BRIAN" ;;
    2026-02-26-claude-cli-unlock)  echo "$GEORGE" ;;
    2026-02-27-teaching-machines-to-teach) echo "$DANIEL" ;;
    2026-02-27-the-cockpit)        echo "$BRIAN" ;;
    2026-02-28-spark)              echo "$RIVER" ;;
    2026-02-28-what-50-agents-taught-me) echo "$BILL" ;;
    2026-03-01-the-cli-changed-under-me) echo "$GEORGE" ;;
    2026-03-02-the-maintenance-layer)    echo "$DANIEL" ;;
    2026-03-02-the-agents-that-never-were) echo "$RIVER" ;;
    2026-03-04-twenty-six-days)    echo "$RIVER" ;;
    2026-03-07-the-three-logs-rule) echo "$DANIEL" ;;
    2026-03-11-the-reversibility-test) echo "$DANIEL" ;;
    2026-03-15-the-context-switch-tax) echo "$BILL" ;;
    2026-03-17-the-signal-under-the-noise) echo "$RIVER" ;;
    2026-03-18-stripe-as-source-of-truth) echo "$BRIAN" ;;
    2026-03-18-the-rebase-cascade) echo "$BRIAN" ;;
    2026-03-21-the-trust-ladder)   echo "$GEORGE" ;;
    2026-03-25-the-debugging-budget) echo "$BILL" ;;
    2026-03-26-agent-swarms-on-a-mac-mini) echo "$BRIAN" ;;
    2026-03-26-the-identity-pipeline) echo "$GEORGE" ;;
    2026-03-29-the-quiet-deploy)   echo "$RIVER" ;;
    2026-04-01-the-retry-tax)      echo "$BILL" ;;
    2026-04-05-blast-radius-thinking) echo "$DANIEL" ;;
    2026-04-09-the-telemetry-trap) echo "$BILL" ;;
    *) echo "" ;;
  esac
}

MODE="${1:-missing}"

echo "=== ElevenLabs Blog Audio Generator ==="
echo "Mode: $MODE"
echo ""

for post_file in "$POSTS_DIR"/2026-*.html; do
  slug=$(basename "$post_file" .html)
  voice_id=$(get_voice "$slug")
  outfile="$AUDIO_DIR/$slug.mp3"

  if [ -z "$voice_id" ]; then
    echo "  SKIP: $slug (no voice assigned)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [ "$MODE" = "missing" ] && [ -f "$outfile" ]; then
    echo "  SKIP: $slug (exists)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  # Back up existing file if regenerating
  if [ -f "$outfile" ]; then
    mv "$outfile" "$outfile.bak"
  fi

  # Extract text
  text=$(python3 "$SCRIPT_DIR/extract-text.py" "$post_file" 2>/dev/null || true)
  text_len=${#text}

  if [ "$text_len" -lt 50 ]; then
    echo "  SKIP: $slug (too short: ${text_len} chars)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "  GEN:  $slug (${text_len} chars)..."

  # Write text to temp file to avoid shell escaping issues
  tmptext=$(mktemp)
  echo "$text" > "$tmptext"

  payload=$(python3 -c "
import json, sys
text = open(sys.argv[1]).read()
print(json.dumps({
    'text': text,
    'model_id': '$MODEL',
    'voice_settings': {
        'stability': 0.5,
        'similarity_boost': 0.75,
        'style': 0.0,
        'use_speaker_boost': True
    }
}))
" "$tmptext")

  http_code=$(curl -s -w "%{http_code}" -o "$outfile" \
    "https://api.elevenlabs.io/v1/text-to-speech/$voice_id" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  rm -f "$tmptext"

  if [ "$http_code" = "200" ]; then
    filesize=$(stat -f%z "$outfile" 2>/dev/null || stat -c%s "$outfile" 2>/dev/null)
    echo "  DONE: $slug ($((filesize / 1024))KB)"
    GENERATED=$((GENERATED + 1))
  else
    echo "  FAIL: $slug (HTTP $http_code)"
    cat "$outfile" 2>/dev/null || true
    echo ""
    rm -f "$outfile"
    FAILED=$((FAILED + 1))
    if [ "$http_code" = "429" ]; then
      echo "  Rate limited. Waiting 60s..."
      sleep 60
    fi
  fi

  # Be nice to the API
  sleep 2
done

echo ""
echo "=== Summary ==="
echo "Generated: $GENERATED | Skipped: $SKIPPED | Failed: $FAILED"
