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

## Usage

1. Install dependencies:

```powershell
pip install -r requirements.txt
```

2. Run the sample index calculation:

```powershell
python scripts/run_sample.py
```

3. Fetch real Korean market data from KRX tickers and generate site rankings:

```powershell
python scripts/fetch_krx_data.py
python scripts/generate_site_data.py
```

If the site data file is missing, the page will display fallback sample rankings until `docs/krx_rankings.json` is refreshed.

## Next steps

- Add real Korean market data sources
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
