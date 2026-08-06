# BlackRock-Grade Polish Plan

- [x] Audit repo + live site (full 4,295-stock universe, multi-factor scoring live)
- [x] Add KOSPI/KOSDAQ market filter to ranking table (dropdown + badges)
- [x] Confirm `market` field present in `docs/krx_rankings.json` (all 4,295 stocks: KOSPI + KOSDAQ)
- [x] Run tests (11 passed)
- [x] 1. Fix methodology mismatch — confirmed engine cards already match `scoring.py` factors exactly
- [x] 3. Improve frontend error handling — removed silent fallback to fake sample data; shows clear "live data unavailable" empty state
- [x] 4. Fix `README.md` — updated to describe multi-factor scoring + full universe + no fake fallback
- [x] 6. Scoring engine tests — already comprehensive in `tests/test_scoring.py` (11 tests)
- [x] 5. PowerShell crawler labeled legacy — documented in README as deprecated fallback
- [x] Commit + push to `origin/main` (commit 58b7c17) — GitHub Pages auto-deploys
- [~] Verify live GitHub Pages propagation (takes a few minutes; already confirmed committed/pushed)
- [ ] Optional: trim live JSON payload (display fields only) for smaller download
