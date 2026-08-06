"""
Multi-factor NOW scoring engine.

Computes a Wall Street-grade composite NOW score from six independent factor
engines, each normalized to a 0-1 percentile rank across the stock universe:

    NOW = 0.25*Valuation + 0.20*Momentum + 0.20*Quality
          + 0.15*Risk + 0.10*Macro + 0.10*Sentiment

Each engine aggregates one or more raw indicators.  Percentile ranks are
computed cross-sectionally, so a stock's score reflects where it sits relative
to its peers in the KOSPI/KOSDAQ universe at the time of computation.
"""

from __future__ import annotations

from statistics import mean, pstdev
from typing import Iterable

# Engine weights (must sum to 1.0)
WEIGHTS = {
    "valuation": 0.25,
    "momentum": 0.20,
    "quality": 0.20,
    "risk": 0.15,
    "macro": 0.10,
    "sentiment": 0.10,
}


def percentile_rank(value: float, values: Iterable[float]) -> float:
    """Return the percentile (0..1) of `value` within `values` (higher = better)."""
    vals = [v for v in values if v is not None]
    if not vals:
        return 0.5
    below = sum(1 for v in vals if v < value)
    equal = sum(1 for v in vals if v == value)
    return (below + 0.5 * equal) / len(vals)


def invert_percentile_rank(value: float, values: Iterable[float]) -> float:
    """Percentile where LOWER raw value is better (e.g. PER, PBR, volatility)."""
    return 1.0 - percentile_rank(value, values)


def safe_float(value) -> float | None:
    """Convert a raw value to float, returning None if it is missing/NaN."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN
        return None
    return f


def valuation_engine(stocks: list[dict]) -> list[float]:
    """Valuation (25%). Lower PER/PBR and higher dividend yield = better."""
    per = [safe_float(s.get("per")) for s in stocks]
    pbr = [safe_float(s.get("pbr")) for s in stocks]
    div = [safe_float(s.get("dividend_yield")) for s in stocks]

    out = []
    for i in range(len(stocks)):
        scores = []
        if per[i] is not None and per[i] > 0:
            scores.append(invert_percentile_rank(per[i], [p for p in per if p is not None and p > 0]))
        if pbr[i] is not None and pbr[i] > 0:
            scores.append(invert_percentile_rank(pbr[i], [p for p in pbr if p is not None and p > 0]))
        if div[i] is not None:
            scores.append(percentile_rank(div[i], [d for d in div if d is not None]))
        out.append(mean(scores) if scores else 0.5)
    return out


def momentum_engine(stocks: list[dict]) -> list[float]:
    """Momentum (20%). Higher returns and closer to 52w high = better."""
    ret1m = [safe_float(s.get("ret_1m")) for s in stocks]
    ret3m = [safe_float(s.get("ret_3m")) for s in stocks]
    ret6m = [safe_float(s.get("ret_6m")) for s in stocks]
    dist_high = [safe_float(s.get("dist_52w_high")) for s in stocks]  # 0..1, 1 = at high

    out = []
    for i in range(len(stocks)):
        scores = []
        for vals in (ret1m, ret3m, ret6m):
            if vals[i] is not None:
                scores.append(percentile_rank(vals[i], [v for v in vals if v is not None]))
        if dist_high[i] is not None:
            scores.append(percentile_rank(dist_high[i], [d for d in dist_high if d is not None]))
        out.append(mean(scores) if scores else 0.5)
    return out


def quality_engine(stocks: list[dict]) -> list[float]:
    """Quality (20%). Higher EPS/BPS and dividend = stronger business."""
    eps = [safe_float(s.get("eps")) for s in stocks]
    bps = [safe_float(s.get("bps")) for s in stocks]
    div = [safe_float(s.get("dividend_yield")) for s in stocks]

    out = []
    for i in range(len(stocks)):
        scores = []
        if eps[i] is not None and eps[i] > 0:
            scores.append(percentile_rank(eps[i], [e for e in eps if e is not None and e > 0]))
        if bps[i] is not None and bps[i] > 0:
            scores.append(percentile_rank(bps[i], [b for b in bps if b is not None and b > 0]))
        if div[i] is not None:
            scores.append(percentile_rank(div[i], [d for d in div if d is not None]))
        out.append(mean(scores) if scores else 0.5)
    return out


def risk_engine(stocks: list[dict]) -> list[float]:
    """Risk (15%). Lower volatility and smaller drawdown = better (inverted)."""
    vol = [safe_float(s.get("volatility")) for s in stocks]
    max_dd = [safe_float(s.get("max_drawdown")) for s in stocks]

    out = []
    for i in range(len(stocks)):
        scores = []
        if vol[i] is not None and vol[i] > 0:
            scores.append(invert_percentile_rank(vol[i], [v for v in vol if v is not None and v > 0]))
        if max_dd[i] is not None and max_dd[i] < 0:
            scores.append(invert_percentile_rank(max_dd[i], [d for d in max_dd if d is not None and d < 0]))
        out.append(mean(scores) if scores else 0.5)
    return out


def macro_engine(stocks: list[dict]) -> list[float]:
    """Macro (10%). Foreign retention rate as a cross-asset proxy."""
    foreign = [safe_float(s.get("foreign_rate")) for s in stocks]
    out = []
    for i in range(len(stocks)):
        if foreign[i] is not None:
            out.append(percentile_rank(foreign[i], [f for f in foreign if f is not None]))
        else:
            out.append(0.5)
    return out


def sentiment_engine(stocks: list[dict]) -> list[float]:
    """Sentiment (10%). Analyst consensus rating + target-price upside."""
    rec = [safe_float(s.get("consensus_rec")) for s in stocks]  # 1..5, higher = buy
    upside = [safe_float(s.get("target_upside")) for s in stocks]  # fraction

    out = []
    for i in range(len(stocks)):
        scores = []
        if rec[i] is not None:
            scores.append(percentile_rank(rec[i], [r for r in rec if r is not None]))
        if upside[i] is not None:
            scores.append(percentile_rank(upside[i], [u for u in upside if u is not None]))
        out.append(mean(scores) if scores else 0.5)
    return out


def compute_momentum_metrics(price_history: list[float]) -> dict:
    """Compute momentum/risk metrics from a series of closing prices (oldest->newest)."""
    if not price_history:
        return {
            "ret_1m": None,
            "ret_3m": None,
            "ret_6m": None,
            "dist_52w_high": None,
            "volatility": None,
            "max_drawdown": None,
        }
    last = price_history[-1]
    n = len(price_history)

    # Monthly returns: use ~21 trading days per month.
    def ret_at(idx):
        p = price_history[idx]
        return (last - p) / p if p else None

    ret_1m = ret_at(-21) if n > 21 else (ret_at(0) if n > 1 else None)
    ret_3m = ret_at(-63) if n > 63 else ret_at(0)
    ret_6m = ret_at(-126) if n > 126 else ret_at(0)

    high = max(price_history)
    dist_52w_high = (last / high) if high else None

    # Volatility: std of daily log returns (annualized proxy).
    if n > 2:
        returns = [(price_history[i] / price_history[i - 1]) - 1 for i in range(1, n)]
        mean_r = mean(returns)
        var = sum((r - mean_r) ** 2 for r in returns) / (len(returns) - 1)
        vol = (var ** 0.5) * (252 ** 0.5) if var > 0 else 0.0
    else:
        vol = None

    # Max drawdown.
    peak = price_history[0]
    max_dd = 0.0
    for p in price_history:
        if p > peak:
            peak = p
        dd = (p - peak) / peak if peak else 0
        if dd < max_dd:
            max_dd = dd
    max_drawdown = max_dd if max_dd < 0 else None

    return {
        "ret_1m": ret_1m,
        "ret_3m": ret_3m,
        "ret_6m": ret_6m,
        "dist_52w_high": dist_52w_high,
        "volatility": vol,
        "max_drawdown": max_drawdown,
    }


def normalize_score(value: float) -> float:
    """Clamp a weighted score into a readable 0-100 range."""
    return round(max(0.0, min(100.0, value * 100.0)), 2)


def compute_scores(stocks: list[dict]) -> list[dict]:
    """Compute per-engine and composite NOW scores for a list of stock dicts.

    Each stock dict must contain the raw indicator fields (per, pbr, eps, bps,
    dividend_yield, ret_1m, ..., volatility, foreign_rate, consensus_rec,
    target_upside).  Returns a new list with 'engine_scores' and 'score' added.
    """
    engines = {
        "valuation": valuation_engine,
        "momentum": momentum_engine,
        "quality": quality_engine,
        "risk": risk_engine,
        "macro": macro_engine,
        "sentiment": sentiment_engine,
    }

    engine_ranks = {}
    for name, fn in engines.items():
        engine_ranks[name] = fn(stocks)

    result = []
    for i, stock in enumerate(stocks):
        engine_scores = {name: round(ranks[i] * 100, 2) for name, ranks in engine_ranks.items()}
        composite = sum(
            WEIGHTS[name] * engine_ranks[name][i] for name in WEIGHTS
        )
        result.append(
            {
                **stock,
                "engine_scores": engine_scores,
                "score": normalize_score(composite),
            }
        )
    return result
