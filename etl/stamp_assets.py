#!/usr/bin/env python3
"""Re-stamp ?v=<content hash> on every local js/css/png URL in web/index.html.
Runs automatically before every `wrangler deploy` (build.command in wrangler.jsonc), so an edited
app.js/styles.css always gets a new URL and browsers never keep a year-cached old copy."""
import hashlib, re
from pathlib import Path
WEB = Path(__file__).resolve().parent.parent / "web"
p = WEB / "index.html"
html = p.read_text(encoding="utf-8")
def ver(m):
    attr, url = m.group(1), m.group(2)
    f = WEB / url
    return f'{attr}="{url}?v={hashlib.sha1(f.read_bytes()).hexdigest()[:10]}"' if f.exists() else m.group(0)
new = re.sub(r'(src|href)="((?:vendor/|assets/)?[\w.-]+\.(?:js|css|png))(?:\?v=[\w]+)?"', ver, html)
if new != html: p.write_text(new, encoding="utf-8")
print("stamped" if new != html else "assets already stamped")
