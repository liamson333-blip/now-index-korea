# NOW Index Korea

A starter repository for building a Korean stock market NOW index.

## Goals
- Collect and normalize Korean market data
- Build a transparent NOW-style index methodology
- Provide a reproducible analysis pipeline

## Structure
- `data/` for raw and processed datasets
- `scripts/` for data collection and index computation
- `src/` for Python package code
- `tests/` for validation

## Data pipeline

The live site is powered by a real data pipeline that crawls **all KOSPI and KOSDAQ stocks** from NAVER Finance and scores them with a Wall Street-grade, six-factor composite:

1. **Crawl** — `scripts/fetch_full_data.py` fetches every KOSPI/KOSDAQ stock (price, change, market cap) plus per-stock fundamentals (PER, EPS, PBR, BPS, dividend yield, foreign ownership, analyst consensus & target) and daily price history for momentum/volatility.
2. **Score** — `scripts/scoring.py` computes a multi-factor NOW score for each stock. Each engine returns a 0–100 percentile rank across the universe, combined as `NOW = 0.25·Valuation + 0.20·Momentum + 0.20·Quality + 0.15·Risk + 0.10·Macro + 0.10·Sentiment`.
3. **Publish** — `scripts/generate_site_data.py` writes the **full sorted universe** (all 4,000+ stocks) to `docs/krx_rankings.json`, so the frontend can search, filter, and paginate through every KOSPI/KOSDAQ stock.

### Reproduce the data

Install dependencies:

```powershell
pip install -r requirements.txt
```

Then crawl and generate:

```powershell
python scripts/fetch_full_data.py          # full 4,000+ stock enrichment (takes a while)
python scripts/generate_site_data.py
```

If `data/full_stock_data.json` is unavailable, `generate_site_data.py` automatically falls back to the simpler price-based crawl from `data/naver_stock_data.csv` (produced by `scripts/fetch_naver_data.py`).

### No Python? Use the PowerShell crawler

On machines without Python (e.g. Windows only), `scripts/fetch_naver_data.ps1` performs a basic crawl and `scripts/crawl_and_generate.ps1` computes the NOW score for all 4,000+ stocks and writes the full ranked universe to the site data file:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\crawl_and_generate.ps1
```

> **Note:** The PowerShell crawler is a **legacy fallback** that uses the simple `price / average_price` scoring and does not run the full multi-factor enrichment. For the complete methodology, use the Python pipeline (`fetch_full_data.py` → `generate_site_data.py`).

If the site data file is missing, the page shows a clear "live data unavailable" banner and an empty state — it never falls back to fake sample stocks.

## Next steps

- Implement a proper index weighting method
- Use `notebooks/krx_analysis_template.ipynb` for analysis and visualization

## Reference

This project is inspired by and references the original work at:

https://github.com/Liam-Son/NOW-index

## Live website

A static site is available from the repository `docs/` folder and can be deployed to GitHub Pages.

Once deployed, the site should be visible at:

https://liamson333-blip.github.io/now-index-korea/

## Continuous integration

A GitHub Actions workflow has been added to run tests on push and pull requests to `main`.

## Automatic data refresh (every 5 minutes)

The live site data is kept fresh automatically via scheduled GitHub Actions workflows, so you never have to manually re-run the pipeline:

1. **`refresh-data.yml` — runs every 5 minutes.**
   - Pulls the latest **prices and daily change** for every KOSPI/KOSDAQ stock from NAVER (`scripts/refresh_prices.py`).
   - Recomputes the NOW scores and regenerates `docs/krx_rankings.json` (`scripts/generate_site_data.py`).
   - If prices changed, it auto-commits and pushes to `main`, which triggers the Pages deploy — so the live site updates within minutes.

2. **`full-enrich.yml` — runs daily (07:20 KST).**
   - Refreshes **fundamentals** (PER, EPS, PBR, dividend yield, foreign ownership, analyst targets) and daily price history for momentum/volatility (`scripts/fetch_full_data.py`).
   - Fundamentals change slowly, so a daily refresh is enough; prices still update every 5 minutes in between.

Because the site is served from GitHub Pages (the `gh-pages` branch, built from `docs/`), every successful push to `main` is automatically deployed. The result is a live site whose prices/scores stay current without any manual work.

> **Note:** GitHub Actions cron schedules have a minimum interval of 5 minutes. In practice, scheduled runs may occasionally be delayed by GitHub's scheduler (typically by a few minutes) during periods of high load. The data is therefore refreshed "around every 5 minutes" during trading hours rather than on a guaranteed exact 5-minute clock.
