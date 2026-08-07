"""
Fast price refresh for the live site.

Crawls the current market-value list (price + daily change for every KOSPI/KOSDAQ
stock) from NAVER, then updates the prices/change_pct in data/full_stock_data.json
in place.  Fundamentals (PER, EPS, momentum, etc.) are preserved from the last full
enrichment so the multi-factor NOW score stays valid while prices are refreshed.

Then generate_site_data.py recomputes rankings.

Usage:
    python scripts/refresh_prices.py
    python scripts/refresh_prices.py --output data/full_stock_data.json
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import requests

MARKET_VALUE_URL = "https://m.stock.naver.com/api/stocks/marketValue/{market}"
PAGE_SIZE = 50
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Referer": "https://finance.naver.com/item/main.naver?code=005930",
}


def fetch_market_stocks(market: str, max_pages: int = 300) -> list[dict]:
    """Fetch the current market list (price, market cap, volume, change)."""
    stocks: list[dict] = []
    page = 1
    while page <= max_pages:
        url = MARKET_VALUE_URL.format(market=market)
        params = {"page": page, "pageSize": PAGE_SIZE}
        resp = requests.get(url, params=params, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        payload = resp.json()
        page_stocks = payload.get("stocks") or []
        if not page_stocks:
            break
        for item in page_stocks:
            stocks.append(
                {
                    "ticker": item.get("itemCode", ""),
                    "price": float(item.get("closePriceRaw") or 0),
                    "change_pct": float(item.get("fluctuationsRatio") or 0),
                    "market_cap": float(item.get("marketValueRaw") or 0),
                    "volume": float(item.get("accumulatedTradingVolumeRaw") or 0),
                    "market": market,
                }
            )
        if page * PAGE_SIZE >= payload.get("totalCount", 0):
            break
        page += 1
        time.sleep(0.2)
    return stocks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="data/full_stock_data.json")
    args = parser.parse_args()

    output = Path(args.output)
    if not output.exists():
        raise FileNotFoundError(
            f"{output} not found. Run `python scripts/fetch_full_data.py` first to build "
            "the enriched dataset."
        )

    # 1. Load current enriched data keyed by ticker.
    with output.open(encoding="utf-8") as fh:
        enriched = json.load(fh)
    by_ticker = {str(s.get("ticker")): s for s in enriched if s.get("ticker")}

    # 2. Fetch fresh market list (price + change) for both markets.
    fresh: dict[str, dict] = {}
    for market in ("KOSPI", "KOSDAQ"):
        print(f"Fetching {market} prices...")
        for item in fetch_market_stocks(market):
            fresh[item["ticker"]] = item
        time.sleep(0.4)

    # 3. Update prices/change_pct/market_cap in place, preserving fundamentals.
    updated = 0
    for stock in enriched:
        ticker = str(stock.get("ticker"))
        f = fresh.get(ticker)
        if f and f.get("price"):
            stock["price"] = f["price"]
            stock["change_pct"] = f.get("change_pct", stock.get("change_pct", 0))
            if f.get("market_cap"):
                stock["market_cap"] = f["market_cap"]
            if f.get("volume"):
                stock["volume"] = f["volume"]
            updated += 1

    with output.open("w", encoding="utf-8") as fh:
        json.dump(enriched, fh, ensure_ascii=False)

    print(f"Updated prices for {updated}/{len(enriched)} stocks in {output}")


if __name__ == "__main__":
    main()
