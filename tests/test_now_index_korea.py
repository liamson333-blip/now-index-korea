from now_index_korea.data import fetch_sample_data
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
