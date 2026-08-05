"""
Crawl Korean stock market data from NAVER Finance.

This script fetches the full list of KOSPI and KOSDAQ stocks from NAVER's
public mobile API, including current price and daily change, then saves the
results to CSV for downstream index computation.

Usage:
    python scripts/fetch_naver_data.py
    python scripts/fetch_naver_data.py --output data/naver_stock_data.csv
"""

from __future__ import annotations

import argparse
import csv
import time
from pathlib import Path

import requests

NAVER_MARKET_VALUE_URL = "https://m.stock.naver.com/api/stocks/marketValue/{market}"
PAGE_SIZE = 20
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Referer": "https://m.stock.naver.com/domestic/stock/005930",
}


def fetch_market_stocks(market: str, max_pages: int = 200) -> list[dict]:
    """Fetch all stocks for a given market ('KOSPI' or 'KOSDAQ')."""
    stocks: list[dict] = []
    page = 1

    while page <= max_pages:
        url = NAVER_MARKET_VALUE_URL.format(market=market)
        params = {"page": page, "pageSize": PAGE_SIZE}
        response = requests.get(url, params=params, headers=HEADERS, timeout=15)
        response.raise_for_status()
        payload = response.json()
        page_stocks = payload.get("stocks") or []

        if not page_stocks:
            break

        for item in page_stocks:
            stocks.append(
                {
                    "ticker": item.get("itemCode", ""),
                    "name": item.get("stockName", ""),
                    "price": float(item.get("closePriceRaw") or 0),
                    "change_pct": float(item.get("fluctuationsRatio") or 0),
                    "change": float(item.get("compareToPreviousClosePriceRaw") or 0),
                    "market": market,
                }
            )

        if page * PAGE_SIZE >= payload.get("totalCount", 0):
            break

        page += 1
        time.sleep(0.3)  # be polite to the API

    return stocks


def write_csv(stocks: list[dict], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ["ticker", "name", "price", "change_pct", "change", "market"]
    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(stocks)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fetch all KOSPI and KOSDAQ stocks from NAVER.")
    parser.add_argument(
        "--output",
        default="data/naver_stock_data.csv",
        help="Output CSV path.",
    )
    parser.add_argument(
        "--markets",
        default="KOSPI,KOSDAQ",
        help="Comma-separated markets to fetch.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    markets = [m.strip().upper() for m in args.markets.split(",") if m.strip()]
    all_stocks: list[dict] = []

    for market in markets:
        print(f"Fetching {market} stocks from NAVER...")
        market_stocks = fetch_market_stocks(market)
        print(f"  Retrieved {len(market_stocks)} stocks")
        all_stocks.extend(market_stocks)
        time.sleep(0.5)

    output = Path(args.output)
    write_csv(all_stocks, output)
    print(f"Saved {len(all_stocks)} stocks to {output}")


if __name__ == "__main__":
    main()
