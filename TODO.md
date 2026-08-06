# Deploy Multi-Factor NOW Score to Live Site

## Objective
Wire the existing 6-engine multi-factor scoring system (`scripts/scoring.py`) into the
data pipeline and deploy it to the live GitHub Pages site so the rankings reflect the new
composite NOW score instead of the old `price / average_price` method.

## Steps
- [x] Wire multi-factor scoring into `scripts/generate_site_data.py`
- [x] Fix `scripts/scoring.py` per-stock engine indexing bug (list vs scalar)
- [x] Generate enriched full-universe data (`data/full_stock_data.json`) via `fetch_full_data.py`
- [x] Verify generator writes full universe (4295) with engine_scores (fallback CSV: neutral 50)
- [x] Update `docs/app.js` to display new scores and engine breakdown
- [x] Add engine tooltip CSS to `docs/styles.css`
- [x] Update `docs/index.html` methodology note + bump cache version
- [x] Regenerate `docs/krx_rankings.json` with real fundamentals once crawl completes
- [x] Verify generated JSON locally (top score 74.93 DL, bottom 22.81, source full_stock_data.json)
- [x] Commit and push to GitHub Pages (commit f4c8f3c pushed to origin/main)

