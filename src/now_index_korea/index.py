from pathlib import Path
import csv


def compute_index(csv_path: str | Path) -> float:
    """Compute a simple sample index value from a CSV file."""
    csv_path = Path(csv_path)
    prices = []
    with csv_path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            prices.append(float(row["price"]))
    if not prices:
        raise ValueError("No price data available")
    return sum(prices) / len(prices)
