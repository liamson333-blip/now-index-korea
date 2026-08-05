from pathlib import Path

import pandas as pd
import yfinance as yf


def fetch_sample_data(output_path: str | None = None) -> Path:
    """Fetch a small sample of Korean market data."""
    output_path = output_path or "data/sample_market_data.csv"
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("ticker,price\n005930,700000\n000660,120000\n", encoding="utf-8")
    return path


def fetch_krx_stock_data(
    tickers: str | list[str],
    period: str = "1mo",
    interval: str = "1d",
    output_path: str | None = None,
) -> Path:
    """Fetch historical Korean stock data for KRX tickers using Yahoo Finance."""
    if isinstance(tickers, str):
        tickers = [ticker.strip() for ticker in tickers.split(",") if ticker.strip()]
    tickers = [ticker if ticker.endswith(".KS") else f"{ticker}.KS" for ticker in tickers]
    data = yf.download(
        tickers,
        period=period,
        interval=interval,
        group_by="ticker",
        auto_adjust=True,
    )

    if data.empty:
        raise ValueError("No data downloaded for requested tickers.")

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = ["_".join(col).strip() for col in data.columns.to_flat_index()]

    output_path = Path(output_path or "data/krx_stock_data.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    data.to_csv(output_path, encoding="utf-8")
    return output_path
