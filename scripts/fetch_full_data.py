"""
Crawl the full KOSPI/KOSDAQ universe from NAVER Finance with real fundamentals.

For every stock this fetches:
  1. Market value row (price, change, market cap, volume) from marketValue API
  2. Integration/fundamentals (PER, EPS, PBR, BPS, dividend yield, 52w high/low,
     foreign rate, consensus target) from the /integration API
  3. Recent daily prices from the chart API (for momentum/volatility/drawdown)

Output is data/full_stock_data.json, ready for generate_site_data.py to score.

Usage:
    python scripts/fetch_full_data.py            # full 4295-stock crawl
    python scripts/fetch_full_data.py --limit 50 # quick test
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import requests

from scoring import compute_momentum_metrics

MARKET_VALUE_URL = "https://m.stock.naver.com/api/stocks/marketValue/{market}"
INTEGRATION_URL = "https://m.stock.naver.com/api/stock/{code}/integration"
CHART_URL = "https://api.stock.naver.com/chart/domestic/item/{code}"
PAGE_SIZE = 50
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    ),
    "Referer": "https://finance.naver.com/item/main.naver?code=005930",
}


def fetch_market_stocks(market: str, max_pages: int = 300) -> list[dict]:
    """Fetch the full market list (price, market cap, volume, change)."""
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
                    "name": item.get("stockName", ""),
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
        time.sleep(0.25)
    return stocks


def fetch_integration(ticker: str) -> dict:
    """Fetch fundamentals (PER, EPS, PBR, BPS, dividend, 52w, foreign, consensus)."""
    url = INTEGRATION_URL.format(code=ticker)
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    infos = {i.get("code"): i.get("value") for i in (data.get("totalInfos") or [])}

    def num(code):
        raw = infos.get(code)
        if raw is None:
            return None
        cleaned = (
            str(raw).replace(",", "").replace("\ubc30", "").replace("%", "").replace("\uc6d0", "").strip()
        )
        try:
            return float(cleaned)
        except ValueError:
            return None

    consensus = data.get("consensusInfo") or {}
    rec = None
    if consensus.get("recommMean"):
        try:
            rec = float(consensus["recommMean"])
        except ValueError:
            rec = None

    target = None
    if consensus.get("priceTargetMean"):
        try:
            target = float(consensus["priceTargetMean"])
        except ValueError:
            target = None

    return {
        "per": num("per"),
        "eps": num("eps"),
        "pbr": num("pbr"),
        "bps": num("bps"),
        "dividend_yield": num("dividendYieldRatio"),
        "high_52w": num("highPriceOf52Weeks"),
        "low_52w": num("lowPriceOf52Weeks"),
        "foreign_rate": num("foreignRate"),
        "consensus_rec": rec,
        "target_price": target,
    }


def fetch_chart(ticker: str, period_type: str = "day", last_count: int = 130) -> list[float]:
    """Fetch recent closing prices (oldest->newest) for momentum/volatility."""
    url = CHART_URL.format(code=ticker)
    params = {"periodType": period_type, "lastCount": last_count}
    resp = requests.get(url, params=params, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    infos = data.get("priceInfos") or []
    closes = []
    for info in infos:
        c = info.get("closePrice")
        if c is not None:
            try:
                closes.append(float(c))
            except (TypeError, ValueError):
                pass
    return closes


def compute_target_upside(price: float, target: float) -> float | None:
    if price and price > 0 and target:
        try:
            target = float(target)
        except (TypeError, ValueError):
            return None
        return (target - price) / price
    return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="Limit per market (0 = all).")
    parser.add_argument("--output", default="data/full_stock_data.json")
    parser.add_argument("--sleep", type=float, default=0.15, help="Seconds between per-stock calls.")
    args = parser.parse_args()

    all_stocks: list[dict] = []
    for market in ("KOSPI", "KOSDAQ"):
        print(f"Fetching {market} list...")
        market_stocks = fetch_market_stocks(market)
        if args.limit:
            market_stocks = market_stocks[: args.limit]
        print(f"  {len(market_stocks)} stocks in {market}")
        all_stocks.extend(market_stocks)
        time.sleep(0.5)

    print(f"\nTotal stocks: {len(all_stocks)}")
    print("Fetching fundamentals + charts for each stock (this takes a while)...")

    enriched = []
    for i, stock in enumerate(all_stocks):
        ticker = stock["ticker"]
        try:
            integration = fetch_integration(ticker)
            closes = fetch_chart(ticker)
            momentum = compute_momentum_metrics(closes)
            stock.update(integration)
            stock.update(momentum)
            stock["target_upside"] = compute_target_upside(
                stock.get("price"), integration.get("target_price")
            )
            enriched.append(stock)
        except Exception as exc:  # noqa: BLE001
            print(f"  [warn] {ticker} {stock.get('name')}: {exc}")
        if (i + 1) % 50 == 0:
            print(f"  {i + 1}/{len(all_stocks)} done")
        time.sleep(args.sleep)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as fh:
        json.dump(enriched, fh, ensure_ascii=False)
    print(f"\nSaved {len(enriched)} enriched stocks to {output}")


if __name__ == "__main__":
    main()
