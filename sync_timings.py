#!/usr/bin/env python3
"""Match Whisper segments to HTML content elements, skipping unspoken elements."""

import json, re, sys, os, subprocess
from pathlib import Path
from html.parser import HTMLParser

class ContentExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.current_text = ''
        self.in_content = False
        self.skip = False
        self.tag_stack = []
        self.content_tags = {'p', 'h2', 'h3', 'pre'}
        
    def handle_starttag(self, tag, attrs):
        cls = dict(attrs).get('class', '')
        if any(x in cls for x in ['audio-player', 'footer', 'post-nav', 'meta', 'post-number']):
            self.skip = True
            return
        if tag in self.content_tags and not self.skip:
            self.in_content = True
            self.current_text = ''
            self.tag_stack.append(tag)
            
    def handle_endtag(self, tag):
        if tag in self.content_tags and self.in_content and self.tag_stack and self.tag_stack[-1] == tag:
            text = ' '.join(self.current_text.split())
            if text and len(text) > 5:
                self.elements.append({'tag': tag, 'text': text})
            self.in_content = False
            self.tag_stack.pop()
        if tag in self.content_tags:
            self.skip = False
            
    def handle_data(self, data):
        if self.in_content:
            self.current_text += data

def normalize(text):
    """Lowercase, strip punctuation, split to words."""
    return re.sub(r'[^a-z0-9\s]', '', text.lower()).split()

def words_overlap(a_words, b_words, threshold=3):
    """Check if enough words from a appear in b (in roughly the right order)."""
    if len(a_words) < threshold:
        threshold = max(1, len(a_words))
    b_set = set(b_words)
    matches = sum(1 for w in a_words if w in b_set)
    return matches >= threshold

def match_element_to_segments(el_text, segments, start_seg=0):
    """Find which segment(s) contain this element's text. Returns (start_seg, end_seg) or None."""
    el_words = normalize(el_text)
    if len(el_words) < 2:
        return None
    
    first_words = el_words[:6]
    last_words = el_words[-4:]
    
    # Search for start
    best_start = None
    for si in range(start_seg, len(segments)):
        seg_words = normalize(segments[si]['text'])
        if words_overlap(first_words, seg_words, min(3, len(first_words))):
            best_start = si
            break
    
    if best_start is None:
        return None
    
    # Search for end
    best_end = best_start
    for si in range(best_start, min(best_start + 15, len(segments))):
        seg_words = normalize(segments[si]['text'])
        if words_overlap(last_words, seg_words, min(2, len(last_words))):
            best_end = si
    
    return (best_start, best_end)

def process_post(post_path, audio_path):
    """Generate timings for a single post."""
    # Whisper
    print(f"  Whisper: {audio_path.name}...")
    tmp = f"/tmp/{post_path.stem}-segments.json"
    result = subprocess.run([
        'curl', '-s', 'https://api.openai.com/v1/audio/transcriptions',
        '-H', f'Authorization: Bearer {os.environ["OPENAI_API_KEY"]}',
        '-F', f'file=@{audio_path}',
        '-F', 'model=whisper-1',
        '-F', 'response_format=verbose_json',
        '-F', 'timestamp_granularities[]=segment',
        '-o', tmp
    ], capture_output=True, timeout=120)
    
    ts = json.load(open(tmp))
    segments = ts['segments']
    duration = ts.get('duration', 300)
    
    # Extract HTML elements
    html = post_path.read_text()
    ext = ContentExtractor()
    ext.feed(html)
    elements = ext.elements
    
    # Match each element
    timings = []
    seg_cursor = 0
    for el in elements:
        match = match_element_to_segments(el['text'], segments, max(0, seg_cursor - 1))
        if match:
            s, e = match
            timings.append({
                'start': round(segments[s]['start'], 2),
                'end': round(segments[e]['end'], 2),
                'matched': True
            })
            seg_cursor = e + 1
        else:
            timings.append(None)  # unspoken element
    
    # Interpolate gaps between matched elements
    for i in range(len(timings)):
        if timings[i] is not None:
            continue
        prev_end = 0
        for j in range(i - 1, -1, -1):
            if timings[j]:
                prev_end = timings[j]['end']
                break
        next_start = duration
        for j in range(i + 1, len(timings)):
            if timings[j]:
                next_start = timings[j]['start']
                break
        # Unspoken elements get a tiny window so they flash briefly or get skipped
        timings[i] = {'start': round(prev_end, 2), 'end': round(prev_end + 0.01, 2)}
    
    # Clean output
    clean = [{'start': t['start'], 'end': t['end']} for t in timings]
    
    # Print summary
    for i, (el, t) in enumerate(zip(elements, clean)):
        spoken = 'SPOKEN' if t['end'] - t['start'] > 0.1 else 'skip'
        print(f"    {i:2d} [{t['start']:6.1f}-{t['end']:6.1f}] {spoken:6s} {el['text'][:50]}")
    
    return clean

def embed_timings(post_path, timings):
    """Embed timings JSON into post HTML."""
    html = post_path.read_text()
    timings_json = json.dumps(timings)
    tag = f'<script id="audio-timings" type="application/json">{timings_json}</script>'
    
    # Replace existing or add new
    if 'audio-timings' in html:
        html = re.sub(r'<script id="audio-timings"[^>]*>.*?</script>', tag, html)
    else:
        html = html.replace('</body>', f'  {tag}\n</body>')
    
    # Ensure sync CSS
    SYNC_CSS = """    /* Listen Mode — Paragraph Sync (requires Whisper timings) */
    body.listen-mode-sync p,
    body.listen-mode-sync h2,
    body.listen-mode-sync h3,
    body.listen-mode-sync pre,
    body.listen-mode-sync .highlight { opacity: 0.2; transition: opacity 0.5s ease; }
    body.listen-mode-sync .lm-active { opacity: 1 !important; }
    body.listen-mode-sync .lm-past { opacity: 0.4; }
    body.listen-mode-sync .lm-code-glow { box-shadow: 0 0 20px rgba(200, 245, 66, 0.12); border-color: var(--accent) !important; }"""
    
    if '.listen-mode-sync' not in html:
        html = html.replace('  </style>', SYNC_CSS + '\n  </style>')
    
    post_path.write_text(html)

# Main
posts_dir = Path('posts')
audio_dir = Path('audio')

for post in sorted(posts_dir.glob('2026-*.html')):
    slug = post.stem
    audio = audio_dir / f'{slug}.mp3'
    if not audio.exists():
        print(f"SKIP {slug}: no audio")
        continue
    
    print(f"\n=== {slug} ===")
    timings = process_post(post, audio)
    embed_timings(post, timings)
    print(f"  ✓ Embedded {len(timings)} timings")

print("\nDone! All posts updated.")
