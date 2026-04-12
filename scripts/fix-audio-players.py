#!/usr/bin/env python3
"""Add audio player div + audio-player.js to posts that are missing them."""
import os, re, sys

posts_dir = os.path.join(os.path.dirname(__file__), '..', 'posts')
audio_dir = os.path.join(os.path.dirname(__file__), '..', 'audio')

modified = 0

for fname in sorted(os.listdir(posts_dir)):
    if not fname.endswith('.html') or not fname.startswith('2026-'):
        continue
    
    slug = fname.replace('.html', '')
    fpath = os.path.join(posts_dir, fname)
    
    with open(fpath, 'r') as f:
        html = f.read()
    
    changed = False
    has_mp3 = os.path.exists(os.path.join(audio_dir, f'{slug}.mp3'))
    
    # Check if audio-player div exists
    has_player_div = 'audio-player' in html and 'ap-label' in html
    
    if not has_player_div:
        # Find the <div class="meta"> line and insert audio player after it
        meta_pattern = r'(<div class="meta">.*?</div>)\s*\n'
        match = re.search(meta_pattern, html)
        if match:
            if has_mp3:
                player_html = f'    <div class="audio-player" data-src="../audio/{slug}.mp3">\n      <span class="ap-label">▶ Listen to this post</span>\n    </div>\n'
            else:
                player_html = f'    <div class="audio-player">\n      <span class="ap-label">Audio coming soon</span>\n    </div>\n'
            
            insert_pos = match.end()
            html = html[:insert_pos] + '\n' + player_html + '\n' + html[insert_pos:]
            changed = True
            print(f'  ADD player: {slug} (mp3={"yes" if has_mp3 else "no"})')
    else:
        # Player div exists — check if it needs data-src wired up
        if has_mp3 and 'Audio coming soon' in html:
            html = html.replace(
                '<div class="audio-player">\n      <span class="ap-label">Audio coming soon</span>',
                f'<div class="audio-player" data-src="../audio/{slug}.mp3">\n      <span class="ap-label">▶ Listen to this post</span>'
            )
            changed = True
            print(f'  WIRE mp3:  {slug}')
    
    # Check if audio-player.js script is included
    if 'audio-player.js' not in html:
        # Add before post-enhance.js or before </body>
        if 'post-enhance.js' in html:
            html = html.replace(
                '<script src="post-enhance.js" defer></script>',
                '<script src="audio-player.js" defer></script>\n  <script src="post-enhance.js" defer></script>'
            )
        else:
            html = html.replace(
                '</body>',
                '  <script src="audio-player.js" defer></script>\n</body>'
            )
        changed = True
        print(f'  ADD js:    {slug}')
    
    if changed:
        with open(fpath, 'w') as f:
            f.write(html)
        modified += 1

print(f'\nModified {modified} files.')
