from __future__ import annotations

import csv
import json
from pathlib import Path


def load_csv_rows(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def extract_rankings(rows: list[dict[str, str]], headers: list[str]) -> list[dict[str, object]]:
    if not rows:
        raise ValueError("CSV file contains no rows")

    if "ticker" in headers and "price" in headers:
        return [
            {
                "ticker": row["ticker"],
                "name": row.get("name", row["ticker"]),
                "price": float(row["price"]),
            }
            for row in rows
        ]

    if any("." in header for header in headers if header != "Date"):
        last_row = rows[-1]
        tickers = sorted({header.split(".")[0] for header in headers if header != "Date"})
        rankings = []
        for ticker in tickers:
            close_field = None
            for candidate in [
                f"{ticker}.KS_Adj Close",
                f"{ticker}.KS_Close",
                f"{ticker}.Adj Close",
                f"{ticker}.Close",
            ]:
                if candidate in headers:
                    close_field = candidate
                    break
            if close_field is None:
                candidates = [h for h in headers if h.startswith(f"{ticker}.")]
                # Use the last numeric field for the ticker if a close field is not found.
                close_field = next((h for h in reversed(candidates) if any(s in h for s in ["Close", "Adj Close", "Close", "Adj"])), None)
            if close_field is None:
                continue
            value = last_row.get(close_field)
            if value is None or value == "":
                continue
            rankings.append(
                {
                    "ticker": ticker,
                    "name": ticker,
                    "price": float(value),
                }
            )
        return rankings

    if "Close" in headers:
        last_row = rows[-1]
        return [
            {
                "ticker": "KRX",
                "name": "KRX Composite",
                "price": float(last_row["Close"]),
            }
        ]

    raise ValueError("Unable to extract pricing data from CSV headers")


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
    csv_path = Path("data/krx_stock_data.csv")
    output_path = Path("docs/krx_rankings.json")
    rows = load_csv_rows(csv_path)
    headers = list(rows[0].keys()) if rows else []
    rankings = extract_rankings(rows, headers)
    ranked = sorted(add_scores(rankings), key=lambda item: item["score"], reverse=True)
    data = {
        "index_value": compute_index_value(rankings),
        "rankings": ranked,
    }
    write_site_data(output_path, data)
    print(f"Wrote live site rankings to {output_path}")


if __name__ == "__main__":
    main()
