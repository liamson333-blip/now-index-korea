from pathlib import Path


def fetch_sample_data(output_path: str | None = None) -> Path:
    """Fetch a small sample of Korean market data."""
    output_path = output_path or "data/sample_market_data.csv"
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("ticker,price\n005930,700000\n000660,120000\n", encoding="utf-8")
    return path
