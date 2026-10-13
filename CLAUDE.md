# kowshik.co.in

Personal site of Kowshik Kesavarapu. Plain static HTML on GitHub Pages: no build step, `main` deploys straight to https://kowshik.co.in.

## SEO rules (apply to every change, every day)

Run `python3 scripts/check_seo.py` before every commit. It must report 0 errors. The same check runs on every pull request and push to `main`.

### Every indexable page
- `<title>` leads with the topic and ends with `— Kowshik Kesavarapu`. Aim for about 60 characters.
- `<meta name="description">` is 50 to 165 characters and says what the reader gets.
- `<link rel="canonical">` is the page's full URL on https://kowshik.co.in, with directory pages ending in `/`.
- Open Graph: `og:type`, `og:site_name`, `og:title`, `og:description`, `og:image` (an absolute URL), `og:url`, plus `twitter:card`.
- The page is listed in `sitemap.xml`. Bump `<lastmod>` when its content changes.
- Exactly one `<h1>`. Headings go in order (h1, then h2, then h3) without skipping a level.
- Every `<img>` has a descriptive `alt`, plus `width` and `height`. Add `loading="lazy" decoding="async"` to images below the fold.
- Links that open in a new tab carry `rel="noopener"`. Icon-only links need an `aria-label`.
- Internal links point at directories (`./`, `../`, `claude-code/day-04/`), never at `index.html`.
- Load fonts from `<head>` with a preconnect, never from a CSS `@import`.
- Keep images small. Resize photos to the largest size they're displayed at (600px for portraits), and strip EXIF data because phone photos carry GPS.

### Each new Claude Code day (`claude-code/day-NN/index.html`)
Copy the previous day's page as the template, then:
1. Set the title, description, canonical, `og:*` and `article:published_time` (YYYY-MM-DD) for the new day.
2. Update the `BlogPosting` JSON-LD (headline, description, url, image, datePublished) and the `BreadcrumbList` JSON-LD.
3. Add a 1200x1200 share image at `claude-code/day-NN.png`.
4. Add the day to `sitemap.xml`.
5. Add a card for it at the top of the Articles list in `claude-code/index.html`.
6. On the previous day's page, add a next link in `.cc-pager`: `<a href="../day-NN/" class="cc-btn">Day N: Short title <i class="fas fa-arrow-right"></i></a>`.
7. In `index.html`, put the new day first in the `series-latest` line and keep the three most recent.
8. Run `python3 scripts/check_seo.py`.

### Pages that should not be indexed
Redirect stubs and the 404 page carry `<meta name="robots" content="noindex">`, stay out of the sitemap, and are listed in `SKIP` in `scripts/check_seo.py`.
