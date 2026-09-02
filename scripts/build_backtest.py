"""Build a price-history backtest for the 75/28 NOW score strategy.

The price history is fetched from NAVER. Fundamentals come from the latest
full_stock_data.json snapshot, so the result is a historical-price simulation,
not a point-in-time investment record.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import date
from pathlib import Path
from xml.etree import ElementTree

import requests

from scoring import compute_momentum_metrics, compute_scores

CHART_URL = "https://fchart.stock.naver.com/sise.nhn"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Referer": "https://finance.naver.com/",
}


def fetch_series(ticker: str, last_count: int) -> list[tuple[str, float]]:
    response = requests.get(
        CHART_URL,
        params={"symbol": ticker, "timeframe": "day", "count": last_count, "requestType": "0"},
        headers=HEADERS,
        timeout=30,
    )
    response.raise_for_status()
    root = ElementTree.fromstring(response.content.decode("euc-kr"))
    result = []
    for item in root.findall(".//item"):
        fields = (item.get("data") or "").split("|")
        if len(fields) < 5:
            continue
        try:
            raw_date, close = fields[0], fields[4]
            result.append((f"{raw_date[:4]}-{raw_date[4:6]}-{raw_date[6:8]}", float(close)))
        except (TypeError, ValueError):
            continue
    return result


def build_history(stocks: list[dict], last_count: int, sleep_seconds: float) -> dict[str, dict[str, float]]:
    history: dict[str, dict[str, float]] = {}
    for index, stock in enumerate(stocks, start=1):
        ticker = str(stock.get("ticker", ""))
        try:
            series = fetch_series(ticker, last_count)
            if len(series) >= 2:
                history[ticker] = dict(series)
        except requests.RequestException as exc:
            print(f"[warn] {ticker}: {exc}")
        if index % 100 == 0:
            print(f"  {index}/{len(stocks)} charts fetched")
        time.sleep(sleep_seconds)
    return history


def make_backtest(stocks: list[dict], history: dict[str, dict[str, float]]) -> dict:
    dates = sorted({day for series in history.values() for day in series})
    cash = {str(stock["ticker"]): 100.0 for stock in stocks if str(stock["ticker"]) in history}
    shares = {ticker: 0.0 for ticker in cash}
    equity_curve = []
    trades = 0

    for day in dates:
        daily = []
        for stock in stocks:
            ticker = str(stock.get("ticker"))
            prices = history.get(ticker, {})
            if day not in prices:
                continue
            prior_prices = [price for item_day, price in sorted(prices.items()) if item_day <= day]
            row = {**stock, "price": prices[day], **compute_momentum_metrics(prior_prices)}
            daily.append(row)
        if not daily:
            continue

        scored = {str(row["ticker"]): row for row in compute_scores(daily)}
        for ticker, row in scored.items():
            price = float(row["price"])
            score = float(row.get("score", 0))
            if shares[ticker] == 0 and score >= 75:
                shares[ticker] = cash[ticker] / price
                cash[ticker] = 0.0
                trades += 1
            elif shares[ticker] > 0 and score <= 28:
                cash[ticker] += shares[ticker] * price
                shares[ticker] = 0.0
                trades += 1

        total = sum(cash[ticker] + shares[ticker] * float(row["price"]) for ticker, row in scored.items())
        equity_curve.append({"date": day, "value": round(total / max(len(cash), 1), 4)})

    final_value = equity_curve[-1]["value"] if equity_curve else 100.0
    return {
        "strategy": {"buy_score": 75, "sell_score": 28},
        "basis": "NAVER daily prices; latest available fundamentals",
        "start_value": 100.0,
        "final_value": final_value,
        "return_pct": round(final_value - 100.0, 2),
        "trades": trades,
        "stocks": len(cash),
        "generated_at": date.today().isoformat(),
        "equity_curve": equity_curve,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/full_stock_data.json")
    parser.add_argument("--output", default="docs/backtest.json")
    parser.add_argument("--last-count", type=int, default=130)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.08)
    args = parser.parse_args()

    stocks = json.loads(Path(args.input).read_text(encoding="utf-8"))
    if args.limit:
        stocks = stocks[: args.limit]
    print(f"Fetching {args.last_count} daily prices for {len(stocks)} stocks...")
    history = build_history(stocks, args.last_count, args.sleep)
    result = make_backtest(stocks, history)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(result['equity_curve'])} points, {result['trades']} trades to {output}")
    print(f"Return: {result['return_pct']:.2f}%")


if __name__ == "__main__":
    main()
