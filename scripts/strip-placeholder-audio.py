#!/usr/bin/env python3
"""Remove misleading 'Audio coming soon' blocks from read-only posts."""
import os
import re

ROOT = os.path.join(os.path.dirname(__file__), '..')
POSTS_DIR = os.path.join(ROOT, 'posts')

PLACEHOLDER_BLOCK = re.compile(
    r'\n\s*<div class="audio-player">\s*\n\s*<span class="ap-label">Audio coming soon</span>\s*\n\s*</div>\s*',
    re.MULTILINE,
)
AUDIO_PLAYER_SCRIPT = re.compile(r'\n\s*<script src="audio-player\.js" defer></script>\s*', re.MULTILINE)


def main() -> None:
    modified = 0

    for entry in sorted(os.listdir(POSTS_DIR)):
        if not entry.endswith('.html'):
            continue

        path = os.path.join(POSTS_DIR, entry)
        with open(path, encoding='utf-8') as handle:
            html = handle.read()

        if 'Audio coming soon' not in html:
            continue

        updated = PLACEHOLDER_BLOCK.sub('\n', html, count=1)
        if 'data-src=' not in updated:
            updated = AUDIO_PLAYER_SCRIPT.sub('\n', updated)

        if updated == html:
            raise SystemExit(f'Could not strip placeholder audio block from {entry}')

        with open(path, 'w', encoding='utf-8') as handle:
            handle.write(updated)
        modified += 1
        print(f'stripped placeholder audio: {entry}')

    print(f'done — updated {modified} post(s)')


if __name__ == '__main__':
    main()
