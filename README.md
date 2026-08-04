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

## Next steps

- Add real Korean market data sources
- Implement a proper index weighting method
- Add notebooks for analysis and visualization

## Continuous integration

A GitHub Actions workflow has been added to run tests on push and pull requests to `main`.
