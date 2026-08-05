from argparse import ArgumentParser
from now_index_korea.data import fetch_krx_stock_data


def parse_args() -> ArgumentParser:
    parser = ArgumentParser(description="Fetch KRX stock data and save it to CSV.")
    parser.add_argument(
        "--tickers",
        default="005930,000660",
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
    tickers = [ticker.strip() for ticker in args.tickers.split(",") if ticker.strip()]
    path = fetch_krx_stock_data(
        tickers,
        period=args.period,
        interval=args.interval,
        output_path=args.output,
    )
    print(f"Fetched KRX data to {path}")


if __name__ == "__main__":
    main()
