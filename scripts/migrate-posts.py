#!/usr/bin/env python3
"""Migrate all old-format blog posts to the 013 template format.

Extracts: post number, title, date, description, og tags, body content.
Outputs: new HTML using the 013 template with audio player.
"""
import re, os, sys, glob
from pathlib import Path

POSTS_DIR = Path(__file__).parent.parent / "posts"
TEMPLATE_POST = POSTS_DIR / "2026-02-27-the-cockpit.html"

# Read 013 as the canonical template
template_html = TEMPLATE_POST.read_text()

# Extract just the CSS/head section from template (everything up to </head>)
# We'll rebuild each post from scratch using the template's style

STYLE_BLOCK = re.search(r'<style>(.*?)</style>', template_html, re.DOTALL).group(1)

def extract_post_metadata(html, filename):
    """Extract metadata from any post format."""
    slug = Path(filename).stem
    
    # Title from <title> tag
    m = re.search(r'<title>(.*?)</title>', html)
    full_title = m.group(1) if m else slug
    
    # Post number and clean title
    m = re.search(r'(\d{3})[:\s]+(.+?)(?:\s*//\s*CLANKA)?$', full_title)
    if m:
        number = m.group(1)
        title = m.group(2).strip()
    else:
        number = "???"
        title = full_title
    
    # Description
    m = re.search(r'<meta name="description" content="(.*?)"', html)
    description = m.group(1) if m else ""
    
    # OG description (might differ)
    m = re.search(r'<meta property="og:description" content="(.*?)"', html)
    og_desc = m.group(1) if m else description
    
    # Date from filename
    m = re.search(r'(\d{4}-\d{2}-\d{2})', slug)
    date = m.group(1) if m else "2026-01-01"
    
    return {
        'number': number,
        'title': title,
        'date': date,
        'description': description,
        'og_description': og_desc,
        'slug': slug,
    }

def extract_body_content(html):
    """Extract the main content paragraphs/sections from any format."""
    # Try article tags first
    m = re.search(r'<article>(.*?)</article>', html, re.DOTALL)
    if m:
        body = m.group(1)
    else:
        # Try main tags
        m = re.search(r'<main>(.*?)</main>', html, re.DOTALL)
        if m:
            body = m.group(1)
        else:
            print(f"  WARNING: Could not extract body", file=sys.stderr)
            return ""
    
    # Clean up — remove post-nav, footer if they snuck in
    body = re.sub(r'<div class="post-nav">.*?</div>', '', body, flags=re.DOTALL)
    body = re.sub(r'<nav class="topnav">.*?</nav>', '', body, flags=re.DOTALL)
    body = re.sub(r'<footer>.*?</footer>', '', body, flags=re.DOTALL)
    
    # Remove old h1 if inside body
    body = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', body, flags=re.DOTALL)
    # Remove old meta div if inside body
    body = re.sub(r'<div class="meta">.*?</div>\s*', '', body, flags=re.DOTALL)
    # Remove hero paragraph — we'll keep it but style it differently
    # Actually, let's keep hero content as the first paragraph
    
    # Strip leading/trailing whitespace per line, normalize
    lines = body.strip().split('\n')
    # Remove excessive indentation
    cleaned = '\n'.join(line.rstrip() for line in lines)
    # Remove multiple blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    
    return cleaned.strip()

def extract_hero(html):
    """Extract hero/lede paragraph if it exists."""
    m = re.search(r'<p class="hero">(.*?)</p>', html, re.DOTALL)
    if m:
        return m.group(1).strip()
    # Some posts have a <div class="hero"> or similar
    m = re.search(r'<div class="hero">(.*?)</div>', html, re.DOTALL)
    if m:
        return m.group(1).strip()
    return None

def build_new_post(meta, body_content, hero=None):
    """Build a post in the 013 format."""
    audio_slug = meta['slug']
    audio_path = f"../audio/{audio_slug}.mp3"
    
    # Check if audio file exists
    audio_file = POSTS_DIR.parent / "audio" / f"{audio_slug}.mp3"
    has_audio = audio_file.exists()
    
    audio_block = ""
    if has_audio:
        audio_block = f'''    <div class="audio-player" data-src="{audio_path}">
      <span class="ap-label">▶ Listen to this post</span>
    </div>
'''
    
    hero_block = ""
    if hero:
        hero_block = f'''    <div class="highlight">
      {hero}
    </div>
'''
    
    # Build prev/next links later — for now just back link
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{meta['description']}" />
  <meta property="og:title" content="{meta['number']}: {meta['title']} // CLANKA" />
  <meta property="og:description" content="{meta['og_description']}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
  <title>{meta['number']}: {meta['title']} // CLANKA</title>
  <style>{STYLE_BLOCK}  </style>
</head>
<body>
  <div class="page">
    <a href="../index.html" class="back">← back</a>
    <div class="post-number">{meta['number']}</div>
    <h1>{meta['title']}</h1>
    <div class="meta">{meta['date']} · clanka</div>
{audio_block}
{hero_block}
{body_content}

    <div class="footer">
      <span>CLANKA · 2026</span>
      <a href="../index.html">clankamode.github.io</a>
    </div>
  </div>
  <script src="audio-player.js"></script>
</body>
</html>'''
    return html

# Process all posts except 013 (the template)
posts = sorted(glob.glob(str(POSTS_DIR / "2026-*.html")))
cockpit = str(POSTS_DIR / "2026-02-27-the-cockpit.html")

for post_path in posts:
    if post_path == cockpit:
        continue
    
    slug = Path(post_path).stem
    html = Path(post_path).read_text()
    
    # Skip if already in new format
    if '<div class="page">' in html and '<div class="post-number">' in html:
        print(f"  SKIP (already new format): {slug}")
        continue
    
    meta = extract_post_metadata(html, post_path)
    body = extract_body_content(html)
    hero = extract_hero(html)
    
    if not body:
        print(f"  SKIP (no body): {slug}")
        continue
    
    new_html = build_new_post(meta, body, hero)
    
    # Write backup
    backup = post_path + '.bak'
    Path(backup).write_text(html)
    
    # Write new
    Path(post_path).write_text(new_html)
    print(f"  MIGRATED: {slug} ({meta['number']}: {meta['title']})")

print("\nDone. Backups saved as .bak files.")
