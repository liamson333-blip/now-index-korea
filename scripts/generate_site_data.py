"""
Generate the live site data (docs/krx_rankings.json) from enriched NAVER data.

The NOW score for each stock is computed from the six-factor composite engine
(Valuation 25%, Momentum 20%, Quality 20%, Risk 15%, Macro 10%, Sentiment 10%),
with each engine producing a 0-100 percentile rank. Every KOSPI and KOSDAQ
stock is published to the live site so the frontend can search and rank the
entire universe.

Scoring uses data/full_stock_data.json when available (enriched by
scripts/fetch_full_data.py). If that file is missing, it falls back to the
simple price-based universe from data/naver_stock_data.csv.

Usage:
    python scripts/generate_site_data.py
"""

from __future__ import annotations

import csv
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from scoring import compute_scores  # noqa: E402


def load_csv_rows(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]


def load_full_json(json_path: Path) -> list[dict]:
    with json_path.open(encoding="utf-8") as handle:
        return json.load(handle)


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


def _f(value):
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN
        return None
    return f


def normalize_full_stocks(stocks: list[dict]) -> list[dict]:
    """Normalize the enriched stocks to the factor fields the engine expects."""
    out = []
    for s in stocks:
        ticker = str(s.get("ticker", "")).strip()
        price = _f(s.get("price"))
        if not ticker or not price:
            continue
        base = {
            "ticker": ticker,
            "name": s.get("name", ticker),
            "price": price,
            "change_pct": _f(s.get("change_pct")) or 0.0,
            "per": _f(s.get("per")),
            "eps": _f(s.get("eps")),
            "pbr": _f(s.get("pbr")),
            "bps": _f(s.get("bps")),
            "dividend_yield": _f(s.get("dividend_yield")),
            "foreign_rate": _f(s.get("foreign_rate")),
            "consensus_rec": _f(s.get("consensus_rec")),
            "target_upside": _f(s.get("target_upside")),
            "ret_1m": _f(s.get("ret_1m")),
            "ret_3m": _f(s.get("ret_3m")),
            "ret_6m": _f(s.get("ret_6m")),
            "dist_52w_high": _f(s.get("dist_52w_high")),
            "volatility": _f(s.get("volatility")),
            "max_drawdown": _f(s.get("max_drawdown")),
        }
        out.append(base)
    return out


def compute_index_value(rankings: list[dict[str, object]]) -> float:
    if not rankings:
        raise ValueError("No ranking data available")
    prices = [float(stock["price"]) for stock in rankings]
    return sum(prices) / len(prices)


def add_scores(rankings: list[dict[str, object]]) -> list[dict[str, object]]:
    """Add the composite 'score' (0-100) and per-engine breakdown."""
    scored = compute_scores(rankings)
    return [
        {
            "ticker": stock["ticker"],
            "name": stock["name"],
            "price": stock["price"],
            "change_pct": stock["change_pct"],
            "engine_scores": stock.get("engine_scores", {}),
            "score": stock.get("score", 0),
        }
        for stock in scored
    ]


def write_site_data(output_path: Path, data: dict[str, object]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)


def main() -> None:
    output_path = Path("docs/krx_rankings.json")

    full_path = Path("data/full_stock_data.json")
    csv_path = Path("data/naver_stock_data.csv")

    if full_path.exists():
        stocks = normalize_full_stocks(load_full_json(full_path))
        source = "full_stock_data.json"
    elif csv_path.exists():
        rows = load_csv_rows(csv_path)
        stocks = extract_rankings(rows)
        source = "naver_stock_data.csv"
    else:
        raise FileNotFoundError(
            "No data found. Run `python scripts/fetch_full_data.py` (recommended) "
            "or `python scripts/fetch_naver_data.py` first."
        )

    if not stocks:
        raise ValueError("No valid stocks parsed from data source.")

    ranked = sorted(add_scores(stocks), key=lambda item: item["score"], reverse=True)

    data = {
        "index_value": compute_index_value(stocks),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "universe_size": len(stocks),
        "source": source,
        "methodology": {
            "valuation": 0.25,
            "momentum": 0.20,
            "quality": 0.20,
            "risk": 0.15,
            "macro": 0.10,
            "sentiment": 0.10,
        },
        "rankings": ranked,
    }
    write_site_data(output_path, data)
    print(f"Wrote {len(ranked)} rankings to {output_path} (source: {source})")
    print(f"Universe size: {len(stocks)} stocks")


if __name__ == "__main__":
    main()

