#!/usr/bin/env python3
"""Extract readable text from a blog post HTML file."""
import re, html, sys

with open(sys.argv[1]) as f:
    content = f.read()

# Try multiple extraction patterns
patterns = [
    r'<article>(.*?)</article>',
    r'<div class="post-number">(.*?)<div class="footer">',
    r'<h1>(.*?)<div class="footer">',
    r'<main>(.*?)</main>',
]
body = None
for pattern in patterns:
    m = re.search(pattern, content, re.DOTALL)
    if m:
        body = m.group(1)
        break
if not body:
    print("Could not extract post body", file=sys.stderr)
    sys.exit(1)

# Strip HTML to plain text
body = re.sub(r'<h[1-3][^>]*>(.*?)</h[1-3]>', r'\n\n\1.\n\n', body)
body = re.sub(r'<pre[^>]*>.*?</pre>', '\n\n', body, flags=re.DOTALL)
body = re.sub(r'<code[^>]*>([^<]+)</code>', r'\1', body)
body = re.sub(r'</p>', '\n\n', body)
body = re.sub(r'<p[^>]*>', '', body)
body = re.sub(r'</?[^>]+>', '', body)
body = html.unescape(body)
body = re.sub(r'\n{3,}', '\n\n', body).strip()
body = re.sub(r'Listen to this post.*', '', body)
print(body)
