from now_index_korea.data import fetch_sample_data
from now_index_korea.index import compute_index


def main() -> None:
    csv_path = fetch_sample_data()
    index_value = compute_index(csv_path)
    print(f"Sample NOW index value: {index_value:.2f}")


if __name__ == "__main__":
    main()
