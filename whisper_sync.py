#!/usr/bin/env python3
"""Whisper paragraph timing sync for blog posts.
Usage: python3 whisper_sync.py <html_path> <audio_path> <slug>
"""

import sys
import os
import json
import re
import subprocess
from html.parser import HTMLParser

LISTEN_MODE_SYNC_CSS = """    /* Listen Mode — Paragraph Sync (requires Whisper timings) */
    body.listen-mode-sync p,
    body.listen-mode-sync h2,
    body.listen-mode-sync h3,
    body.listen-mode-sync pre,
    body.listen-mode-sync .highlight { opacity: 0.2; transition: opacity 0.5s ease; }
    body.listen-mode-sync .lm-active { opacity: 1 !important; }
    body.listen-mode-sync .lm-past { opacity: 0.4; }
    body.listen-mode-sync .lm-code-glow { box-shadow: 0 0 20px rgba(200, 245, 66, 0.12); border-color: var(--accent) !important; }"""

TRACK_TAGS = {'p', 'h2', 'h3', 'pre'}
SKIP_CLASSES = {'audio-player', 'footer', 'post-nav', 'meta', 'post-number'}


class ContentExtractor(HTMLParser):
    """Extract text content from trackable elements, skipping UI containers."""

    def __init__(self):
        super().__init__()
        self.elements = []
        self._tracking = False
        self._tracking_tag = None
        self._tracking_depth = 0
        self._text_parts = []
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if self._skip_depth > 0:
            self._skip_depth += 1
            if self._tracking:
                self._tracking_depth += 1
            return

        attrs_d = dict(attrs)
        classes = set(attrs_d.get('class', '').split())

        if classes & SKIP_CLASSES:
            self._skip_depth = 1
            return

        if self._tracking:
            self._tracking_depth += 1
            return

        # Start tracking
        if tag == 'div' and 'highlight' in classes:
            self._tracking = True
            self._tracking_tag = 'div'
            self._tracking_depth = 0
            self._text_parts = []
        elif tag in TRACK_TAGS:
            self._tracking = True
            self._tracking_tag = tag
            self._tracking_depth = 0
            self._text_parts = []

    def handle_endtag(self, tag):
        if self._skip_depth > 0:
            self._skip_depth -= 1
            return

        if not self._tracking:
            return

        if self._tracking_depth > 0:
            self._tracking_depth -= 1
            return

        # depth == 0: this closes our tracked element
        text = ' '.join(self._text_parts)
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            self.elements.append(text)
        self._tracking = False
        self._tracking_tag = None
        self._text_parts = []

    def handle_data(self, data):
        if self._skip_depth > 0:
            return
        if self._tracking:
            self._text_parts.append(data)


def normalize_word(w):
    return re.sub(r'[^a-z0-9]', '', w.lower())


def find_timing(text, words, start_idx):
    """Find start/end timestamps for HTML element text in the Whisper word list.

    Returns (start_time, end_time, next_word_idx).
    Uses forward search with lookahead window for first word,
    then searches for last word around expected position.
    """
    tokens = text.split()
    clean_tokens = [normalize_word(t) for t in tokens]
    clean_tokens = [t for t in clean_tokens if t]

    n = len(words)

    if not clean_tokens or start_idx >= n:
        fallback = words[min(start_idx, n - 1)]['start'] if words else 0.0
        return fallback, fallback, start_idx

    first = clean_tokens[0]
    last = clean_tokens[-1]

    # Search for first word in a forward window (40 words)
    start_wi = None
    window_end = min(start_idx + 40, n)
    for i in range(start_idx, window_end):
        if normalize_word(words[i]['word']) == first:
            start_wi = i
            break

    if start_wi is None:
        # Fall back to current position
        fallback_time = words[start_idx]['start']
        end_idx = min(start_idx + len(clean_tokens), n - 1)
        return fallback_time, words[end_idx]['end'], end_idx + 1

    start_time = words[start_wi]['start']

    # Search for last word around expected position
    expected_end = start_wi + len(clean_tokens)
    search_end = min(expected_end + 20, n - 1)

    end_wi = None
    # Search backwards from search_end to start_wi
    for i in range(search_end, start_wi, -1):
        if normalize_word(words[i]['word']) == last:
            end_wi = i
            break

    if end_wi is None:
        end_wi = min(expected_end, n - 1)

    end_time = words[end_wi]['end']
    next_idx = end_wi + 1

    return start_time, end_time, next_idx


def build_timings(elements, words):
    """Generate {start, end} timing for each element."""
    timings = []
    wi = 0
    for elem in elements:
        s, e, wi = find_timing(elem, words, wi)
        timings.append({'start': round(s, 2), 'end': round(e, 2)})

    # Ensure no timing goes backwards (end < start)
    for i, t in enumerate(timings):
        if t['end'] < t['start']:
            if i + 1 < len(timings):
                t['end'] = timings[i + 1]['start']
            else:
                t['end'] = t['start'] + 1.0

    return timings


def process_post(html_path, audio_path, slug):
    # Step 1: Call Whisper API
    json_path = f'/tmp/{slug}-timestamps.json'
    print(f"  [1/5] Calling Whisper API for {slug}...")

    cmd = [
        'curl', '-s',
        'https://api.openai.com/v1/audio/transcriptions',
        '-H', f'Authorization: Bearer {os.environ["OPENAI_API_KEY"]}',
        '-F', f'file=@{audio_path}',
        '-F', 'model=whisper-1',
        '-F', 'response_format=verbose_json',
        '-F', 'timestamp_granularities[]=word',
        '-F', 'timestamp_granularities[]=segment',
        '-o', json_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        print(f"  ERROR: curl failed: {result.stderr}")
        return False

    with open(json_path) as f:
        raw = f.read()

    try:
        whisper = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  ERROR: Invalid JSON from Whisper: {e}")
        print(f"  Response preview: {raw[:300]}")
        return False

    if 'words' not in whisper:
        print(f"  ERROR: No word timestamps. Keys: {list(whisper.keys())}")
        if 'error' in whisper:
            print(f"  API error: {whisper['error']}")
        return False

    words = whisper['words']
    duration = whisper.get('duration', '?')
    print(f"  [2/5] Got {len(words)} words, duration={duration}s")

    # Step 2: Read HTML
    with open(html_path) as f:
        html = f.read()

    # Step 3: Extract content elements
    extractor = ContentExtractor()
    extractor.feed(html)
    elements = extractor.elements
    print(f"  [3/5] Extracted {len(elements)} content elements")
    if elements:
        print(f"        First: {elements[0][:60]}...")
        print(f"        Last:  {elements[-1][:60]}...")

    # Step 4: Match timings
    print(f"  [4/5] Matching timings to {len(words)} Whisper words...")
    timings = build_timings(elements, words)

    # Step 5: Patch HTML
    print(f"  [5/5] Patching HTML...")

    # Add listen-mode-sync CSS if not present
    if 'listen-mode-sync' not in html:
        marker = '    body.listen-mode .audio-player { border-color: var(--accent); box-shadow: 0 0 12px rgba(200, 245, 66, 0.08); }'
        if marker in html:
            html = html.replace(marker, marker + '\n' + LISTEN_MODE_SYNC_CSS)
        else:
            # Fallback: insert before closing </style>
            html = html.replace('  </style>', LISTEN_MODE_SYNC_CSS + '\n  </style>', 1)

    # Remove any existing audio-timings script
    html = re.sub(r'\s*<script id="audio-timings"[^>]*>[\s\S]*?</script>', '', html)

    # Embed timings before </body>
    timings_json = json.dumps(timings)
    script_tag = f'  <script id="audio-timings" type="application/json">{timings_json}</script>\n'
    html = html.replace('</body>', script_tag + '</body>', 1)

    with open(html_path, 'w') as f:
        f.write(html)

    print(f"  Done: {len(timings)} timings embedded.")
    return True


if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(f"Usage: {sys.argv[0]} <html_path> <audio_path> <slug>")
        sys.exit(1)

    success = process_post(sys.argv[1], sys.argv[2], sys.argv[3])
    sys.exit(0 if success else 1)
