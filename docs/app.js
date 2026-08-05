const sampleStocks = [
  { ticker: '005930', name: 'Samsung Electronics', price: 700000 },
  { ticker: '000660', name: 'SK Hynix', price: 120000 },
  { ticker: '035420', name: 'Naver', price: 310000 },
  { ticker: '051910', name: 'LG Energy Solution', price: 950000 },
];

function computeIndex(prices) {
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function computeScore(price, average) {
  return price / average;
}

function formatValue(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatScore(value) {
  return value.toFixed(2);
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

function renderRankings(stocks) {
  const body = document.getElementById('rankingBody');
  body.innerHTML = stocks
    .map(
      (stock, index) =>
        `<tr><td>${index + 1}</td><td>${stock.ticker}</td><td>${stock.name}</td><td>${formatValue(stock.price)}</td><td>${formatScore(stock.score)}</td></tr>`,
    )
    .join('');
}

async function loadSiteData() {
  try {
    const response = await fetch(`krx_rankings.json?cache=${Date.now()}`, { cache: 'reload' });
    if (!response.ok) {
      throw new Error(`Unable to fetch site data: ${response.statusText}`);
    }
    const data = await response.json();
    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = formatValue(data.index_value);
    renderRankings(data.rankings);
  } catch (error) {
    const fallbackRankings = getRankings(sampleStocks);
    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = formatValue(computeIndex(sampleStocks.map((stock) => stock.price)));
    renderRankings(fallbackRankings);
    const body = document.getElementById('rankingBody');
    const messageRow = document.createElement('tr');
    messageRow.innerHTML = `<td colspan="5">Using sample ranking data: ${error.message}</td>`;
    body.prepend(messageRow);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshButton').addEventListener('click', loadSiteData);
  loadSiteData();
});
