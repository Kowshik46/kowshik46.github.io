#!/usr/bin/env python3
"""SEO checks for kowshik.co.in. Run: python3 scripts/check_seo.py

Fails (exit 1) when a page breaks one of the rules in CLAUDE.md.
Standard library only, so it runs anywhere without installs.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://kowshik.co.in"
SKIP = {"404.html", "generic.html"}  # noindex pages
errors, warnings = [], []


def url_for(rel):
    rel = rel.as_posix()
    if rel == "index.html":
        return BASE + "/"
    if rel.endswith("/index.html"):
        return f"{BASE}/{rel[:-len('index.html')]}"
    return f"{BASE}/{rel}"


def meta(html, attr, key):
    m = re.search(rf'<meta {attr}="{re.escape(key)}" content="([^"]*)"', html)
    return m.group(1) if m else None


sitemap = (ROOT / "sitemap.xml").read_text()
sitemap_urls = set(re.findall(r"<loc>(.*?)</loc>", sitemap))
pages = sorted(p for p in ROOT.rglob("*.html")
               if ".git" not in p.parts and p.relative_to(ROOT).as_posix() not in SKIP)

for path in pages:
    rel = path.relative_to(ROOT)
    html = path.read_text()
    url = url_for(rel)
    err = lambda msg: errors.append(f"{rel}: {msg}")

    title = re.search(r"<title>(.*?)</title>", html, re.S)
    if not title:
        err("missing <title>")
    elif len(title.group(1)) > 75:
        warnings.append(f"{rel}: title is {len(title.group(1))} chars; Google shows about 60")
    desc = meta(html, "name", "description")
    if not desc:
        err("missing meta description")
    elif not 50 <= len(desc) <= 165:
        err(f"meta description is {len(desc)} chars; keep it 50-165")
    canon = re.search(r'<link rel="canonical" href="([^"]+)"', html)
    if not canon or canon.group(1) != url:
        err(f"canonical should be {url}")
    for key in ("og:title", "og:description", "og:image", "og:url", "og:type"):
        if not meta(html, "property", key):
            err(f"missing {key}")
    if meta(html, "property", "og:url") not in (None, url):
        err(f"og:url should be {url}")
    if url not in sitemap_urls:
        err(f"{url} is not in sitemap.xml")
    if len(re.findall(r"<h1[\s>]", html)) != 1:
        err("needs exactly one <h1>")
    for img in re.findall(r"<img\b[^>]*>", html):
        for a in ("alt", "width", "height"):
            if f'{a}="' not in img:
                err(f"<img> missing {a}: {img[:80]}")
    for a in re.findall(r'<a\b[^>]*target="_blank"[^>]*>', html):
        if "noopener" not in a:
            err(f'new-tab link missing rel="noopener": {a[:80]}')
    types = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError as e:
            err(f"invalid JSON-LD: {e}")
            continue
        for node in data.get("@graph", [data]):
            types.append(node.get("@type"))

    day = re.fullmatch(r"claude-code/day-(\d+)/index\.html", rel.as_posix())
    if day:
        n = int(day.group(1))
        for t in ("BlogPosting", "BreadcrumbList"):
            if t not in types:
                err(f"missing {t} JSON-LD")
        if not meta(html, "property", "article:published_time"):
            err("missing article:published_time")
        slug = f"day-{day.group(1)}/"
        if f'href="{slug}"' not in (ROOT / "claude-code/index.html").read_text():
            err(f"not linked from claude-code/index.html")
        prev = ROOT / f"claude-code/day-{n - 1:02d}/index.html"
        if prev.exists() and f'href="../{slug}"' not in prev.read_text():
            err(f"previous day (day-{n - 1:02d}) has no next link to it")

# The newest article must be linked from the home page.
days = sorted(ROOT.glob("claude-code/day-*/index.html"))
if days:
    latest = days[-1].parent.name
    if f'href="claude-code/{latest}/"' not in (ROOT / "index.html").read_text():
        errors.append(f"index.html: 'Latest' line does not link the newest article ({latest})")

for w in warnings:
    print("warning:", w)
for e in errors:
    print("error:", e)
print(f"{len(pages)} pages checked, {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
