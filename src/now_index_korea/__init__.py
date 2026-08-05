"""NOW Index Korea package."""

from .data import fetch_krx_stock_data, fetch_sample_data
from .index import compute_index

__all__ = ["fetch_krx_stock_data", "fetch_sample_data", "compute_index"]
