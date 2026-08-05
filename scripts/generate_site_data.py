"""
Generate the live site data (docs/krx_rankings.json) from NAVER stock data.

The NOW score for each stock is computed as its price divided by the average
price across the full universe. Every KOSPI and KOSDAQ stock is published to
the live site so the frontend can search and rank the entire universe.

Usage:
    python scripts/generate_site_data.py
"""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path


def load_csv_rows(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def extract_rankings(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    if not rows:
        raise ValueError("CSV file contains no rows")

    rankings = []
    for row in rows:
        ticker = row.get("ticker", "").strip()
        name = row.get("name", ticker)
        price = float(row.get("price") or 0)
        change_pct = float(row.get("change_pct") or 0)
        if not ticker or price <= 0:
            continue
        rankings.append(
            {
                "ticker": ticker,
                "name": name,
                "price": price,
                "change_pct": change_pct,
            }
        )
    return rankings


def compute_index_value(rankings: list[dict[str, object]]) -> float:
    if not rankings:
        raise ValueError("No ranking data available")
    prices = [float(stock["price"]) for stock in rankings]
    return sum(prices) / len(prices)


def add_scores(rankings: list[dict[str, object]]) -> list[dict[str, object]]:
    average_price = compute_index_value(rankings)
    return [
        {
            **stock,
            "score": round(float(stock["price"]) / average_price, 4),
        }
        for stock in rankings
    ]


def write_site_data(output_path: Path, data: dict[str, object]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)


def main() -> None:
    csv_path = Path("data/naver_stock_data.csv")
    output_path = Path("docs/krx_rankings.json")
    if not csv_path.exists():
        raise FileNotFoundError(
            f"{csv_path} not found. Run `python scripts/fetch_naver_data.py` first."
        )

    rows = load_csv_rows(csv_path)
    rankings = extract_rankings(rows)
    ranked = sorted(add_scores(rankings), key=lambda item: item["score"], reverse=True)

    data = {
        "index_value": compute_index_value(rankings),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "universe_size": len(rankings),
        "rankings": ranked,
    }
    write_site_data(output_path, data)
    print(f"Wrote {len(ranked)} rankings to {output_path}")
    print(f"Universe size: {len(rankings)} stocks")


if __name__ == "__main__":
    main()
