from pathlib import Path
from unittest.mock import patch

import pandas as pd
from now_index_korea.data import fetch_sample_data, fetch_krx_stock_data
from now_index_korea.index import compute_index


def test_compute_index_from_sample_data(tmp_path):
    csv_path = tmp_path / "sample.csv"
    csv_path.write_text("ticker,price\n005930,700000\n000660,120000\n", encoding="utf-8")
    result = compute_index(csv_path)
    assert result == 410000.0


def test_fetch_sample_data_creates_file(tmp_path):
    output_path = tmp_path / "sample_market_data.csv"
    path = fetch_sample_data(str(output_path))
    assert path.exists()
    assert "005930" in path.read_text(encoding="utf-8")


def test_fetch_krx_stock_data_saves_csv(tmp_path, monkeypatch):
    dummy = pd.DataFrame(
        {
            "Open": [700000],
            "High": [705000],
            "Low": [695000],
            "Close": [702000],
            "Volume": [1000000],
        },
        index=pd.DatetimeIndex(["2026-01-01"]),
    )

    def fake_download(tickers, period, interval, group_by, auto_adjust):
        return dummy

    monkeypatch.setattr("now_index_korea.data.yf.download", fake_download)

    output_path = tmp_path / "krx_stock_data.csv"
    path = fetch_krx_stock_data(["005930"], period="1mo", interval="1d", output_path=str(output_path))

    assert path.exists()
    content = path.read_text(encoding="utf-8")
    assert "Open" in content
    assert "2026-01-01" in content
