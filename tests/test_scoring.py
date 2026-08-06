"""Tests for the multi-factor scoring engine (scripts/scoring.py)."""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from scoring import (  # noqa: E402
    WEIGHTS,
    compute_scores,
    invert_percentile_rank,
    momentum_engine,
    percentile_rank,
    quality_engine,
    risk_engine,
    sentiment_engine,
    valuation_engine,
)


@pytest.fixture
def sample_stocks():
    return [
        {
            "ticker": "000001",
            "name": "Cheap Co",
            "price": 5000,
            "per": 4.0,
            "pbr": 0.5,
            "eps": 1200,
            "bps": 9000,
            "dividend_yield": 5.0,
            "ret_1m": 0.10,
            "ret_3m": 0.25,
            "ret_6m": 0.40,
            "dist_52w_high": 0.98,
            "volatility": 0.15,
            "max_drawdown": -0.10,
            "foreign_rate": 30.0,
            "consensus_rec": 4.5,
            "target_upside": 0.30,
        },
        {
            "ticker": "000002",
            "name": "Pricy Co",
            "price": 50000,
            "per": 40.0,
            "pbr": 5.0,
            "eps": 100,
            "bps": 1000,
            "dividend_yield": 0.5,
            "ret_1m": -0.10,
            "ret_3m": -0.20,
            "ret_6m": -0.30,
            "dist_52w_high": 0.50,
            "volatility": 0.50,
            "max_drawdown": -0.60,
            "foreign_rate": 5.0,
            "consensus_rec": 2.0,
            "target_upside": -0.10,
        },
    ]


def test_weights_sum_to_one():
    assert sum(WEIGHTS.values()) == pytest.approx(1.0)


def test_weights_keys():
    assert set(WEIGHTS) == {
        "valuation",
        "momentum",
        "quality",
        "risk",
        "macro",
        "sentiment",
    }


def test_percentile_rank():
    assert percentile_rank(3, [1, 2, 3, 4, 5]) == 0.5
    assert percentile_rank(1, [1, 2, 3, 4, 5]) > 0.0
    assert percentile_rank(1, [1, 2, 3, 4, 5]) < percentile_rank(5, [1, 2, 3, 4, 5])


def test_invert_percentile_rank():
    assert invert_percentile_rank(1, [1, 2, 3]) > invert_percentile_rank(3, [1, 2, 3])


def test_engines_prefer_cheap_high_quality(sample_stocks):
    v = valuation_engine(sample_stocks)
    q = quality_engine(sample_stocks)
    m = momentum_engine(sample_stocks)
    s = sentiment_engine(sample_stocks)

    # Cheap co should score higher on valuation, quality, momentum, sentiment
    assert v[0] > v[1]
    assert q[0] > q[1]
    assert m[0] > m[1]
    assert s[0] > s[1]


def test_risk_engine_prefers_lower_volatility():
    stocks = [
        {"volatility": 0.10, "max_drawdown": -0.05},
        {"volatility": 0.60, "max_drawdown": -0.05},
    ]
    r = risk_engine(stocks)
    # Lower volatility should score higher on risk.
    assert r[0] > r[1]


def test_compute_scores_output(sample_stocks):
    scored = compute_scores(sample_stocks)
    assert len(scored) == 2
    for stock in scored:
        assert "score" in stock
        assert "engine_scores" in stock
        assert 0.0 <= stock["score"] <= 100.0
        assert set(stock["engine_scores"]) == set(WEIGHTS)


def test_compute_scores_ranks_cheap_first(sample_stocks):
    scored = compute_scores(sample_stocks)
    # Cheap Co should have the higher composite score.
    assert scored[0]["score"] > scored[1]["score"]
