const sampleStocks = [
  { ticker: '005930', name: 'Samsung Electronics', price: 700000, change_pct: 1.25 },
  { ticker: '000660', name: 'SK Hynix', price: 120000, change_pct: -0.85 },
  { ticker: '035420', name: 'Naver', price: 310000, change_pct: 2.4 },
  { ticker: '051910', name: 'LG Energy Solution', price: 950000, change_pct: 0.5 },
];

let currentRankings = [];
let currentData = null;

function computeIndex(prices) {
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function computeScore(price, average) {
  return price / average;
}

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

function formatValue(value) {
  return currencyFormatter.format(value);
}

function formatScore(value) {
  return value.toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getRankings(stocks) {
  const averagePrice = computeIndex(stocks.map((stock) => stock.price));
  return stocks
    .map((stock) => ({
      ...stock,
      score: computeScore(stock.price, averagePrice),
    }))
    .sort((a, b) => b.score - a.score);
}

function changeClass(value) {
  if (value > 0) return 'change-up';
  if (value < 0) return 'change-down';
  return 'change-flat';
}

function changeSymbol(value) {
  if (value > 0) return '▲';
  if (value < 0) return '▼';
  return '•';
}

function renderRankings(stocks, filtered = false) {
  const body = document.getElementById('rankingBody');
  const loadingRow = document.getElementById('loadingRow');
  if (loadingRow) loadingRow.remove();

  if (!stocks.length) {
    body.innerHTML = `<tr><td colspan="6" class="empty-state">No stocks match your search.</td></tr>`;
    return;
  }

  body.innerHTML = stocks
    .map(
      (stock, index) => `
        <tr>
          <td><span class="rank-badge ${index < 3 ? 'top' : ''}">${index + 1}</span></td>
          <td class="ticker-cell">${stock.ticker}</td>
          <td class="name-cell">${stock.name}</td>
          <td class="price-cell">${formatValue(stock.price)}</td>
          <td class="change-cell ${changeClass(stock.change_pct)}">
            ${changeSymbol(stock.change_pct)} ${stock.change_pct != null ? stock.change_pct.toFixed(2) + '%' : '—'}
          </td>
          <td class="score-cell">${formatScore(stock.score)}</td>
        </tr>`,
    )
    .join('');

  const resultCount = document.getElementById('resultCount');
  if (filtered) {
    resultCount.hidden = false;
    resultCount.textContent = `Showing ${stocks.length} of ${currentRankings.length} stocks`;
  } else {
    resultCount.hidden = true;
  }
}

function renderStats(data) {
  const rankings = data.rankings;
  document.getElementById('statCount').textContent = rankings.length;

  const top = rankings.reduce((max, stock) => (stock.score > max.score ? stock : max), rankings[0]);
  const topEl = document.getElementById('statTop');
  topEl.textContent = top ? top.name : '—';

  const avg = computeIndex(rankings.map((stock) => stock.price));
  document.getElementById('statAvg').textContent = formatValue(avg);

  document.getElementById('statDate').textContent = formatDate(data.date);
}

function setLoading(isLoading) {
  const spinner = document.getElementById('refreshSpinner');
  const label = document.querySelector('#refreshButton .btn-label');
  if (isLoading) {
    spinner.hidden = false;
    label.textContent = 'Refreshing…';
    document.getElementById('refreshButton').disabled = true;
  } else {
    spinner.hidden = true;
    label.textContent = 'Refresh preview';
    document.getElementById('refreshButton').disabled = false;
  }
}

function showError(message) {
  const banner = document.getElementById('errorBanner');
  banner.hidden = false;
  banner.textContent = message;
}

function hideError() {
  const banner = document.getElementById('errorBanner');
  banner.hidden = true;
}

function applyFilter() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) {
    renderRankings(currentRankings, false);
    return;
  }
  const filtered = currentRankings.filter(
    (stock) =>
      stock.name.toLowerCase().includes(query) || stock.ticker.toLowerCase().includes(query),
  );
  renderRankings(filtered, true);
}

async function loadSiteData() {
  hideError();
  setLoading(true);
  try {
    const response = await fetch(`krx_rankings.json?cache=${Date.now()}`, { cache: 'reload' });
    if (!response.ok) {
      throw new Error(`Unable to fetch site data: ${response.statusText}`);
    }
    const data = await response.json();
    currentData = data;
    currentRankings = getRankings(data.rankings);

    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = formatValue(data.index_value);
    document.getElementById('indexMeta').textContent = `As of ${formatDate(data.date)}`;

    renderStats(data);
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
      applyFilter();
    } else {
      renderRankings(currentRankings);
    }
  } catch (error) {
    // Fallback to sample data
    const fallbackRankings = getRankings(sampleStocks);
    currentRankings = fallbackRankings;
    currentData = {
      index_value: computeIndex(sampleStocks.map((stock) => stock.price)),
      rankings: fallbackRankings,
      date: null,
    };

    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = formatValue(currentData.index_value);
    document.getElementById('indexMeta').textContent = 'Using sample data';

    renderStats(currentData);
    renderRankings(fallbackRankings);
    showError(`⚠ Sample data in use: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshButton').addEventListener('click', loadSiteData);
  document.getElementById('searchInput').addEventListener('input', applyFilter);
  loadSiteData();
});
