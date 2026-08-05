import sys
from argparse import ArgumentParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from now_index_korea.data import fetch_krx_stock_data


def normalize_ticker(ticker: str) -> str:
    ticker = ticker.strip()
    if ticker.isdigit() and len(ticker) <= 6:
        return ticker.zfill(6)
    return ticker


def parse_args() -> ArgumentParser:
    parser = ArgumentParser(description="Fetch KRX stock data and save it to CSV.")
    parser.add_argument(
        "--tickers",
        default="005930,000660,035420,051910",
        help="Comma-separated list of KRX tickers (e.g. 005930,000660).",
    )
    parser.add_argument("--period", default="1mo", help="Historical data period.")
    parser.add_argument("--interval", default="1d", help="Data interval.")
    parser.add_argument(
        "--output",
        default="data/krx_stock_data.csv",
        help="Path to output CSV file.",
    )
    return parser


def main() -> None:
    parser = parse_args()
    args = parser.parse_args()
    tickers = [normalize_ticker(ticker) for ticker in args.tickers.split(",") if ticker.strip()]
    path = fetch_krx_stock_data(
        tickers,
        period=args.period,
        interval=args.interval,
        output_path=args.output,
    )
    print(f"Fetched KRX data to {path}")
    generate_site = Path("scripts/generate_site_data.py")
    if generate_site.exists():
        print("Run 'python scripts/generate_site_data.py' to refresh site rankings after data fetch.")


if __name__ == "__main__":
    main()
