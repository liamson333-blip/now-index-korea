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

The live site is powered by a real data pipeline that crawls **all KOSPI and KOSDAQ stocks** from NAVER Finance:

1. **Crawl** — `scripts/fetch_naver_data.py` fetches every KOSPI/KOSDAQ stock (price + daily change) from NAVER's public API.
2. **Compute** — the NOW score for each stock is `price / average_price` across the full universe.
3. **Publish** — `scripts/generate_site_data.py` writes the **top 10** stocks by NOW score to `docs/krx_rankings.json`.

### Reproduce the data

Install dependencies:

```powershell
pip install -r requirements.txt
```

Then crawl and generate:

```powershell
python scripts/fetch_naver_data.py
python scripts/generate_site_data.py
```

### No Python? Use the PowerShell crawler

On machines without Python (e.g. Windows only), a PowerShell fallback performs the same crawl, computes the NOW score for all 4,000+ stocks, and writes the top 10 to the site data file:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\crawl_and_generate.ps1
```

If the site data file is missing, the page will display fallback sample rankings until `docs/krx_rankings.json` is refreshed.

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
