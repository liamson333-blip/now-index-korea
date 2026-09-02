"""Append the day's published prices and NOW scores to the PIT history."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="docs/krx_rankings.json")
    parser.add_argument("--output", default="data/score_history.json")
    parser.add_argument("--keep-days", type=int, default=365)
    args = parser.parse_args()

    ranking_data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    snapshot_date = ranking_data.get("date") or date.today().isoformat()
    stocks = [
        {
            "ticker": str(stock["ticker"]),
            "price": float(stock["price"]),
            "score": float(stock.get("score", 0)),
        }
        for stock in ranking_data.get("rankings", [])
        if stock.get("ticker") and stock.get("price")
    ]

    output = Path(args.output)
    history = json.loads(output.read_text(encoding="utf-8")) if output.exists() else []
    history = [snapshot for snapshot in history if snapshot.get("date") != snapshot_date]
    history.append({"date": snapshot_date, "stocks": stocks})
    history = sorted(history, key=lambda snapshot: snapshot.get("date", ""))[-args.keep_days :]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(history, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Recorded {len(stocks)} stocks for {snapshot_date}; {len(history)} daily snapshots stored")


if __name__ == "__main__":
    main()
