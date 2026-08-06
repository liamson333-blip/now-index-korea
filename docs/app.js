const DEFAULT_PAGE_SIZE = 50;

let currentRankings = [];
let currentData = null;
let currentPage = 1;
let PAGE_SIZE = DEFAULT_PAGE_SIZE;
let sortKey = 'score';
let sortDir = 'desc';

const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function computeIndex(prices) {
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function formatValue(value) {
  return currencyFormatter.format(value);
}

function formatScore(value) {
  if (value == null || isNaN(value)) return '—';
  return Number(value).toFixed(2);
}

function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  return compactFormatter.format(Number(value));
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

// Rankings are already pre-computed in the JSON (sorted by score desc).
// We keep markers so search still works across the full universe.
function getRankings(stocks) {
  return stocks;
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

function naverUrl(ticker) {
  return `https://finance.naver.com/item/main.naver?code=${ticker}`;
}

const ENGINE_LABELS = {
  valuation: 'Valuation',
  momentum: 'Momentum',
  quality: 'Quality',
  risk: 'Risk',
  macro: 'Macro',
  sentiment: 'Sentiment',
};

function marketBadge(stock) {
  const market = stock && stock.market;
  if (market) {
    return `<span class="market-badge ${market === 'KOSDAQ' ? 'kosdaq' : 'kospi'}">${market}</span> `;
  }
  // Heuristic fallback: KOSDAQ tickers often start with 0/1/2/3/4, KOSPI with 0/1/2/3/5/6/7.
  const t = (stock && stock.ticker) || '';
  const isKosdaq = /^[0-4]/.test(t);
  return `<span class="market-badge ${isKosdaq ? 'kosdaq' : 'kospi'}">${isKosdaq ? 'KOSDAQ' : 'KOSPI'}</span> `;
}

function engineBreakdown(stock) {
  const engineScores = stock && stock.engine_scores;
  if (!engineScores || typeof engineScores !== 'object') return '';
  const rows = Object.keys(ENGINE_LABELS)
    .filter((key) => engineScores[key] != null)
    .map(
      (key) =>
        `<div class="engine-row"><span>${ENGINE_LABELS[key]}</span><b>${formatScore(engineScores[key])}</b></div>`,
    )
    .join('');
  if (!rows) return '';
  return `<span class="engine-tooltip"><span class="engine-dot" title="Engine breakdown">i</span><span class="engine-tooltip-box">${rows}</span></span>`;
}

function sortedCopy(list) {
  const dir = sortDir === 'asc' ? 1 : -1;
  return list.slice().sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (va == null) va = sortKey === 'score' ? 0 : -Infinity;
    if (vb == null) vb = sortKey === 'score' ? 0 : -Infinity;
    if (sortKey === 'name' || sortKey === 'ticker' || sortKey === 'market') {
      return dir * String(va).localeCompare(String(vb));
    }
    return dir * (Number(va) - Number(vb));
  });
}

function renderRankings(stocks, filtered = false) {
  const body = document.getElementById('rankingBody');
  const loadingRow = document.getElementById('loadingRow');
  if (loadingRow) loadingRow.remove();

  if (!stocks.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty-state">No stocks match your search.</td></tr>`;
    return;
  }

  const sorted = sortedCopy(stocks);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageStocks = sorted.slice(start, start + PAGE_SIZE);

  body.innerHTML = pageStocks
    .map((stock, index) => {
      const rank = start + index + 1;
      const url = naverUrl(stock.ticker);
      return `
        <tr>
          <td><span class="rank-badge ${rank <= 3 ? 'top' : ''}">${rank}</span></td>
          <td class="ticker-cell"><a class="naver-link" href="${url}" target="_blank" rel="noopener">${stock.ticker}</a></td>
          <td class="name-cell"><a class="naver-link" href="${url}" target="_blank" rel="noopener">${stock.name || stock.ticker}</a></td>
          <td class="market-cell">${marketBadge(stock)}</td>
          <td class="price-cell">${formatValue(stock.price)}</td>
          <td class="change-cell ${changeClass(stock.change_pct)}">
            ${changeSymbol(stock.change_pct)} ${stock.change_pct != null ? stock.change_pct.toFixed(2) + '%' : '—'}
          </td>
          <td class="cap-cell">${formatCompact(stock.market_cap)}</td>
          <td class="score-cell">
            <span class="score-value">${formatScore(stock.score)}</span>
            ${engineBreakdown(stock)}
          </td>
        </tr>`;
    })
    .join('');

  const resultCount = document.getElementById('resultCount');
  if (filtered || total > PAGE_SIZE) {
    resultCount.hidden = false;
    resultCount.textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, total)} of ${total} stocks`;
  } else {
    resultCount.hidden = true;
  }

  renderPagination(totalPages, total);
}

function renderPagination(totalPages, total) {
  const container = document.getElementById('pagination');
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  let html = '';
  html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="1" class="page-btn" aria-label="First page">«</button>`;
  html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" class="page-btn">‹ Prev</button>`;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  for (let p = startPage; p <= endPage; p++) {
    html += `<button data-page="${p}" class="page-btn ${p === currentPage ? 'active' : ''}">${p}</button>`;
  }
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" class="page-btn">Next ›</button>`;
  html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${totalPages}" class="page-btn" aria-label="Last page">»</button>`;
  container.innerHTML = html;
}

function renderStats(data) {
  const rankings = data.rankings;
  document.getElementById('statCount').textContent = data.universe_size || rankings.length;

  const top = rankings[0];
  const topEl = document.getElementById('statTop');
  topEl.textContent = top ? top.name : '—';

  const avg = data.index_value || computeIndex(rankings.map((stock) => stock.price));
  document.getElementById('statAvg').textContent = formatValue(avg);

  document.getElementById('statDate').textContent = formatDate(data.date);

  const sourceEl = document.getElementById('statSource');
  if (sourceEl) {
    const source = (data.source || 'naver').replace(/_|\.json/gi, ' ').trim();
    sourceEl.textContent = source ? `NAVER · ${source}` : 'NAVER';
  }

  // Methodology dashboard metrics
  const universeEl = document.getElementById('methodUniverse');
  if (universeEl) {
    universeEl.textContent = new Intl.NumberFormat('ko-KR').format(
      data.universe_size || rankings.length,
    );
  }
  const avgEl = document.getElementById('methodAvg');
  if (avgEl) {
    avgEl.textContent = formatValue(avg);
  }
  const indexEl = document.getElementById('methodIndex');
  if (indexEl) {
    indexEl.textContent = formatValue(data.index_value);
  }

  renderMarketDistribution(rankings);
}

function renderMarketDistribution(rankings) {
  const kospiEl = document.getElementById('kospiCount');
  const kosdaqEl = document.getElementById('kosdaqCount');
  if (!kospiEl || !kosdaqEl) return;
  let kospi = 0;
  let kosdaq = 0;
  rankings.forEach((s) => {
    if (s.market === 'KOSPI') kospi++;
    else if (s.market === 'KOSDAQ') kosdaq++;
  });
  kospiEl.textContent = new Intl.NumberFormat('ko-KR').format(kospi);
  kosdaqEl.textContent = new Intl.NumberFormat('ko-KR').format(kosdaq);
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

function getFilteredRankings() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const market = document.getElementById('marketFilter').value;
  let list = currentRankings;
  if (market && market !== 'all') {
    list = list.filter((stock) => stock.market === market);
  }
  if (query) {
    list = list.filter(
      (stock) =>
        (stock.name || '').toLowerCase().includes(query) ||
        (stock.ticker || '').toLowerCase().includes(query),
    );
  }
  return list;
}

function applyFilter() {
  const query = document.getElementById('searchInput').value.trim();
  const market = document.getElementById('marketFilter').value;
  const filtered = getFilteredRankings();
  currentPage = 1;
  renderRankings(filtered, !!(query || (market && market !== 'all')));
}

function renderCurrent() {
  const query = document.getElementById('searchInput').value.trim();
  const market = document.getElementById('marketFilter').value;
  if (query || (market && market !== 'all')) {
    applyFilter();
  } else {
    renderRankings(currentRankings);
  }
}

function exportCSV() {
  const rows = sortedCopy(getFilteredRankings());
  if (!rows.length) return;
  const header = [
    'rank',
    'ticker',
    'name',
    'market',
    'price',
    'change_pct',
    'market_cap',
    'score',
    'valuation',
    'momentum',
    'quality',
    'risk',
    'macro',
    'sentiment',
  ];
  const lines = [header.join(',')];
  rows.forEach((s, i) => {
    const es = s.engine_scores || {};
    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    lines.push(
      [
        i + 1,
        esc(s.ticker),
        esc(s.name),
        s.market || '',
        s.price,
        s.change_pct,
        s.market_cap || '',
        s.score,
        es.valuation ?? '',
        es.momentum ?? '',
        es.quality ?? '',
        es.risk ?? '',
        es.macro ?? '',
        es.sentiment ?? '',
      ].join(','),
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `now-index-korea_${currentData && currentData.date ? currentData.date : 'export'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

    // Rankings come pre-sorted by score desc. Filter out any entries missing a ticker.
    currentRankings = (data.rankings || []).filter((s) => s && s.ticker);
    currentPage = 1;

    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = formatValue(data.index_value);
    document.getElementById('indexMeta').textContent = `As of ${formatDate(data.date)}`;

    renderStats(data);
    renderCurrent();
  } catch (error) {
    // Do NOT silently fall back to fake sample data. Show a clear empty state
    // so it is obvious the live feed is unavailable.
    currentRankings = [];
    currentPage = 1;
    currentData = null;

    const indexElement = document.getElementById('indexValue');
    indexElement.textContent = '—';
    document.getElementById('indexMeta').textContent = 'Live data unavailable';

    const body = document.getElementById('rankingBody');
    const loadingRow = document.getElementById('loadingRow');
    if (loadingRow) loadingRow.remove();
    body.innerHTML =
      `<tr><td colspan="8" class="empty-state">` +
      `⚠ Live market data could not be loaded (${error.message}). ` +
      `Please refresh to retry.</td></tr>`;

    const pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';
    const resultCount = document.getElementById('resultCount');
    if (resultCount) resultCount.hidden = true;

    showError(
      `⚠ Live data could not be loaded (${error.message}). Refresh to retry.`,
    );
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshButton').addEventListener('click', loadSiteData);
  document.getElementById('searchInput').addEventListener('input', applyFilter);
  const marketFilter = document.getElementById('marketFilter');
  if (marketFilter) marketFilter.addEventListener('change', applyFilter);
  const pageSize = document.getElementById('pageSize');
  if (pageSize) {
    pageSize.addEventListener('change', () => {
      PAGE_SIZE = parseInt(pageSize.value, 10) || DEFAULT_PAGE_SIZE;
      currentPage = 1;
      renderCurrent();
    });
  }
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);

  // Sortable headers
  document.querySelectorAll('th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortKey = key;
        sortDir = key === 'name' || key === 'ticker' || key === 'market' ? 'asc' : 'desc';
      }
      document.querySelectorAll('th.sortable').forEach((t) => {
        t.classList.remove('sorted-asc', 'sorted-desc');
      });
      th.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      renderCurrent();
    });
  });

  document.getElementById('pagination').addEventListener('click', (event) => {
    const btn = event.target.closest('.page-btn');
    if (!btn || btn.disabled) return;
    currentPage = parseInt(btn.dataset.page, 10);
    renderCurrent();
  });

  loadSiteData();
});
