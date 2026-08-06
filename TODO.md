# Flawless Polish Plan

## Completed
- [x] Audit repo + live site (full 4,295-stock universe, multi-factor scoring live)
- [x] Add KOSPI/KOSDAQ market filter to ranking table (dropdown + badges)
- [x] Confirm `market` + `market_cap` fields present in `docs/krx_rankings.json` (all stocks)
- [x] Run tests (11 passed)
- [x] Fix methodology display mismatch (engine cards match scoring.py exactly)
- [x] Improve frontend error handling (no silent fallback to fake sample data)
- [x] Update `README.md` to describe multi-factor scoring + full universe
- [x] Scoring engine tests (`tests/test_scoring.py`, 11 tests)
- [x] **Sortable columns** (price, change, market cap, NOW score) with asc/desc indicators
- [x] **Market cap column** with compact formatting
- [x] **KOSPI/KOSDAQ distribution summary** chips
- [x] **Selectable page size** (25/50/100/250 per page)
- [x] **CSV export** of the currently filtered/sorted view
- [x] **First/last page** navigation buttons
- [x] Bump app.js cache to 11 to force browser refresh
- [x] Commit + push to `origin/main` (commit f100ee2)

## Notes
- Live site: https://liamson333-blip.github.io/now-index-korea/
- GitHub Pages auto-deploys from `docs/` on push to `main`
</content>
