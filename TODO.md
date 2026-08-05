# Website Improvement Plan

- [x] Analyze current website structure
- [x] Get user approval on improvement plan
- [x] Update `docs/index.html` with enhanced structure (meta tags, favicon, stats, search, improved table)
- [x] Update `docs/styles.css` with polished styling (fonts, animations, badges, responsive)
- [x] Update `docs/app.js` with enhanced functionality (search, stats, loading/error states)
- [x] Update `docs/krx_rankings.json` with richer data (change_pct, date)
- [x] Test locally by opening the site in a browser

## NAVER Data Pipeline (real data)

- [x] Verify NAVER API endpoints & required fields
- [x] Create `scripts/fetch_naver_data.py` (Python crawler for all KOSPI/KOSDAQ)
- [x] Create `scripts/crawl_and_generate.ps1` (PowerShell fallback crawler)
- [x] Update `scripts/generate_site_data.py` (compute NOW scores, top 10)
- [x] Generate top-10 JSON via NAVER crawl → `docs/krx_rankings.json` (4,295 stocks)
- [x] Update `docs/index.html` to describe NAVER data pipeline
- [x] Update `README.md` with pipeline & usage docs
## Full-universe display (all KOSPI/KOSDAQ stocks)

- [x] Regenerate `docs/krx_rankings.json` with the full 4,295-stock universe (index_value 27963, no nulls/Infinity)
- [x] Update `docs/app.js` to render the full universe with pagination (50 per page) and cross-page search
- [x] Update `docs/styles.css` with pagination component styles
- [x] Update `docs/index.html` with pagination element, universe_size stats, and remove top-10 wording
- [x] Update `scripts/generate_site_data.py` to publish the full ranked universe
- [x] Update `README.md` to reflect full-universe publishing

- [ ] Push changes to GitHub to update live site (with user confirmation)
