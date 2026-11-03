# Yamada Lab website

Static site built with [Eleventy](https://www.11ty.dev/) and published to GitHub Pages (`yamada-lab-icob.github.io`, later `yamada-lab.org`) by `.github/workflows/deploy.yml` on every push to `main`.

## Routine updates (content files only, never layout)

| Update | File | Effort |
|---|---|---|
| New paper / preprint | `bibliography/papers.bib` (Zotero "Lab publications" → Better BibTeX export) + one entry in `src/_data/listed_papers.yml` (citation key + type: Article / Perspective / …) + one news file. Only papers listed there appear; the homepage shows the first three | ~2 min |
| News item | `src/news/YYYY-MM-DD-short-name.md` (front matter `date:`, one or two sentences of markdown) | ~1 min |
| Member joins / leaves | `src/_data/members.yml` (add entry; on leaving set `alumni: true` and `now:`) + photo in `src/assets/img/people/` | ~1 min |
| Research direction shift | `src/_data/research.yml` (question + 3 axes, used by Home and Research) and `src/research.md` (prose) | few × / year |
| Positions open / close | `src/join.md`; homepage banner in `src/_data/site.yml` → `recruiting:` | occasional |
| Links (Scholar, ICOB profile) | `src/_data/site.yml` → `links:` (empty value = hidden) | once |
| Hero animation (`selforg` cell self-organization, or `turing` reaction–diffusion) or a static image | `src/_data/site.yml` → `hero.animation` / `hero.image` (preview with `/?hero=turing`) | once |

Layout lives in `src/_includes/`, `src/assets/css/site.css`, and `src/assets/js/` (`selforg.js`, `morphogen.js`).

## Preview locally

```sh
npm install      # first time only
npm start        # http://localhost:8080, live-reloads on save
```

## Publish (one-time setup)

1. Public repo `yamada-lab-icob/yamada-lab-icob.github.io` (GitHub org `yamada-lab-icob`); push this folder to `main`.
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. Custom domain `yamada-lab.org` (Porkbun): verify the domain in the org's Pages settings (TXT record), add the GitHub Pages DNS records at Porkbun, set the custom domain in repo Settings → Pages, then update `url:` in `site.yml`. With the GitHub Actions source no `CNAME` file is needed.
