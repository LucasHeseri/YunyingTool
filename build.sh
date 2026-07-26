#!/bin/bash
# Build dist.html — inline all JS into a single portable file
cd "$(dirname "$0")"
python3 << 'PYEOF'
import re, os
with open('图片加工工具.html', 'r') as f:
    html = f.read()
def replace_src(match):
    src = match.group(2)
    if not src or src.startswith('http'):
        return match.group(0)
    filepath = os.path.join(os.path.dirname(__file__), src.lstrip('./'))
    if not os.path.exists(filepath):
        return match.group(0)
    with open(filepath, 'r') as f:
        content = f.read().strip()
    return f'<script>\n{content}\n</script>'
html = re.sub(r'(<script\b[^>]*\s+src\s*=\s*"([^"]*)"[^>]*>)\s*</script>', replace_src, html)
with open('dist.html', 'w') as f:
    f.write(html)
size = os.path.getsize('dist.html')
print(f'dist.html: {size:,} bytes')
PYEOF
