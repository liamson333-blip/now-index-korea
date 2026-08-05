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
- [ ] Push changes to GitHub to update live site (with user confirmation)
