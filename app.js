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

let currentLanguage = localStorage.getItem('now-index-language') || 'en';

const translations = {
  en: {
    languageToggle: '한국어', languageLabel: 'Switch to Korean', asOf: 'As of', unavailable: 'Live data unavailable', noMatches: 'No stocks match your search.', showing: 'Showing {start}–{end} of {total} stocks', dataLoadError: 'Live data could not be loaded', retry: 'Refresh to retry.', eyebrow: 'NOW Index Korea',
    heroTitle: 'Transparent Korean market indexing for <span class="accent">KRX stocks</span>',
    heroDescription: 'Explore a lightweight, open-source index built from KRX stock data with a clear, reproducible methodology. Live rankings, transparent scores, and a live preview.', github: 'View GitHub Repo', liveSite: 'Open Live Site', indexPreview: 'Now-style index value', loading: 'Loading market data…', refresh: 'Refresh preview', refreshing: 'Refreshing…', stocksTracked: 'Stocks tracked', topPerformer: 'Top performer', averagePrice: 'Average price', dataSource: 'Data source', dataUpdated: 'Data updated', rankingTitle: 'Korean stocks ranked by NOW index score', rankingDescription: 'Live rankings are generated from KRX data and updated from the site data feed.', searchPlaceholder: 'Search ticker or name…', searchLabel: 'Search stocks', allMarkets: 'All markets', rowsPerPage: 'Rows per page', exportCsv: '↓ Export CSV', methodology: 'NOW score methodology', methodologyDescription: 'A Wall Street–grade composite built from six independent factor engines. Each engine answers a distinct question about a stock; the engines are weighted and combined into a single, transparent NOW score.', universe: 'Universe', avgPrice: 'Avg price', indexValue: 'Index value', composite: 'Composite NOW score', valuation: 'Valuation', momentum: 'Momentum', quality: 'Quality', risk: 'Risk', macro: 'Macro', sentiment: 'Sentiment', valuationQuestion: 'Is this asset cheap relative to its peers?', momentumQuestion: 'Is the market rewarding this asset?', qualityQuestion: 'Is this a fundamentally strong business?', riskQuestion: 'How risky is this investment?', macroQuestion: 'Is the ownership base supportive?', sentimentQuestion: 'What do analysts expect?', liveComposite: 'Live composite.', about: 'About the project', how: 'How it works', dataSourceTitle: 'Data source', openSource: 'Open source', reference: 'Reference', footer: 'NOW Index Korea • Open source Korean market index starter project', disclaimer: 'Data is for demonstration purposes and not investment advice.',
  },
  ko: {
    languageToggle: 'English', languageLabel: '영어로 전환', asOf: '기준일', unavailable: '실시간 데이터를 사용할 수 없습니다', noMatches: '검색 결과가 없습니다.', showing: '{total}개 종목 중 {start}–{end} 표시', dataLoadError: '실시간 데이터를 불러오지 못했습니다', retry: '새로고침하여 다시 시도하세요.', eyebrow: 'NOW Index Korea', heroTitle: '투명한 한국 시장 지수 <span class="accent">KRX 종목</span>', heroDescription: 'KRX 주식 데이터로 만든 오픈소스 지수를 살펴보세요. 명확하고 재현 가능한 방법론, 실시간 순위와 투명한 점수를 제공합니다.', github: 'GitHub 저장소 보기', liveSite: '라이브 사이트 열기', indexPreview: 'NOW 스타일 지수', loading: '시장 데이터 불러오는 중…', refresh: '지수 새로고침', refreshing: '새로고침 중…', stocksTracked: '추적 종목 수', topPerformer: '최고 점수 종목', averagePrice: '평균 가격', dataSource: '데이터 출처', dataUpdated: '데이터 기준일', rankingTitle: 'NOW 지수 점수별 한국 주식 순위', rankingDescription: 'KRX 데이터를 기반으로 생성된 실시간 순위입니다.', searchPlaceholder: '종목코드 또는 종목명 검색…', searchLabel: '종목 검색', allMarkets: '전체 시장', rowsPerPage: '페이지당 행 수', exportCsv: '↓ CSV 내보내기', methodology: 'NOW 점수 방법론', methodologyDescription: '6개의 독립적인 팩터 엔진으로 구성된 투명한 종합 지수입니다. 각 엔진은 서로 다른 질문에 답하고 가중치에 따라 하나의 NOW 점수로 결합됩니다.', universe: '전체 종목', avgPrice: '평균 가격', indexValue: '지수 값', composite: '종합 NOW 점수', valuation: '밸류에이션', momentum: '모멘텀', quality: '퀄리티', risk: '리스크', macro: '매크로', sentiment: '센티먼트', valuationQuestion: '동종 종목보다 저평가되어 있는가?', momentumQuestion: '시장이 이 종목을 긍정적으로 평가하는가?', qualityQuestion: '기초체력이 강한 기업인가?', riskQuestion: '투자 위험은 어느 정도인가?', macroQuestion: '주주 구성이 우호적인가?', sentimentQuestion: '애널리스트의 전망은 어떠한가?', liveComposite: '실시간 종합 점수.', about: '프로젝트 소개', how: '작동 방식', dataSourceTitle: '데이터 출처', openSource: '오픈소스', reference: '참고', footer: 'NOW Index Korea • 오픈소스 한국 시장 지수 프로젝트', disclaimer: '본 데이터는 시연 목적이며 투자 조언이 아닙니다.',
  },
};

const translationTargets = {
  eyebrow: '.eyebrow', heroTitle: '.hero h1', heroDescription: '.hero-content > div:first-child > p', github: '.hero-actions .button:first-child', liveSite: '.hero-actions .button-secondary', indexPreview: '.panel-label', loading: '#indexMeta', refresh: '#refreshButton .btn-label', stocksTracked: '.stat-card:nth-child(1) .stat-label', topPerformer: '.stat-card:nth-child(2) .stat-label', averagePrice: '.stat-card:nth-child(3) .stat-label', dataSource: '.stat-card:nth-child(4) .stat-label', dataUpdated: '.stat-card:nth-child(5) .stat-label', rankingTitle: '.ranking-section h2', rankingDescription: '.ranking-section .section-head p', searchPlaceholder: '#searchInput', allMarkets: '#marketFilter option[value="all"]', rowsPerPage: '#pageSize', exportCsv: '#exportBtn', methodology: '.methodology h2', methodologyDescription: '.methodology .method-head p', universe: '.method-metric:nth-child(1) .method-metric-label', avgPrice: '.method-metric:nth-child(2) .method-metric-label', indexValue: '.method-metric:nth-child(3) .method-metric-label', composite: '.method-formula-label', about: '.grid article:first-child h2', how: '.grid article:nth-child(2) h2', dataSourceTitle: '.card:nth-child(1) h3', openSource: '.card:nth-child(2) h3', reference: '.card:nth-child(3) h3', footer: 'footer p:first-child', disclaimer: 'footer .footer-note',
};

function translate(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

function applyLanguage(language) {
  currentLanguage = language;
  const dictionary = translations[language];
  const strategyText = language === 'ko'
    ? {
        title: 'NOW Score는 어떻게 작동하나요?',
        description: 'NOW Score는 6개 팩터를 기준으로 각 종목을 0점부터 100점까지 상대평가합니다. 점수가 높을수록 현재 KOSPI/KOSDAQ 전체 종목에서 순위가 높다는 뜻이며, 수익을 보장하는 예측치는 아닙니다.',
        buy: '75점 이상일 때 진입', hold: '매도 기준점보다 점수가 높은 동안 보유', sell: '점수가 약 28점까지 하락하면 매도',
        backtest: '이 전략으로 수익을 냈을까요?', status: '과거 데이터 필요', emptyTitle: '실제 수익률 그래프를 아직 계산할 수 없습니다',
        emptyText: '현재 피드는 오늘의 가격과 점수만 제공합니다. 신뢰할 수 있는 수익률을 계산하려면 매수·매도 신호 시점의 날짜별 점수와 가격이 필요합니다.', end: '과거 스냅샷 수집 대기',
        note: '필요한 과거 관측값이 쌓일 때까지 수익 금액을 표시하지 않습니다. 오늘의 점수를 과거 가격에 적용하면 룩어헤드 편향으로 결과가 왜곡되기 때문입니다.',
      }
    : {
        title: 'How NOW Score works',
        description: 'NOW Score ranks each stock from 0 to 100 across six factors. A higher score means the stock ranks better against the current KOSPI/KOSDAQ universe; it is not a guaranteed return forecast.',
        buy: 'Enter when score reaches 75 or higher', hold: 'Hold while the signal remains above the exit level', sell: 'Exit when score falls to around 28',
        backtest: 'Would this strategy have made money?', status: 'Historical data required', emptyTitle: 'Real profit chart is not available yet',
        emptyText: 'The current feed contains only today’s price and score. We need dated score snapshots plus prices at each buy and sell signal before calculating a trustworthy return.', end: 'Historical snapshots pending',
        note: 'No profit number is shown until the required historical observations exist. This avoids look-ahead bias: applying today’s score to old prices would make the result misleading.',
      };
  const strategyTargets = { scoreStoryTitle: 'title', scoreStoryDescription: 'description', buyRule: 'buy', holdRule: 'hold', sellRule: 'sell', backtestTitle: 'backtest', backtestStatus: 'status', chartEmptyTitle: 'emptyTitle', chartEmptyText: 'emptyText', chartEndLabel: 'end', backtestNote: 'note' };
  Object.entries(strategyTargets).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = strategyText[key];
  });
  Object.entries(translationTargets).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (!element || !dictionary[key]) return;
    if (key === 'heroTitle') element.innerHTML = dictionary[key];
    else if (key === 'searchPlaceholder') element.placeholder = dictionary[key];
    else element.textContent = dictionary[key];
  });
  const toggle = document.getElementById('languageToggle');
  toggle.textContent = dictionary.languageToggle;
  toggle.setAttribute('aria-label', dictionary.languageLabel);
  document.documentElement.lang = language;
  localStorage.setItem('now-index-language', language);
  document.querySelectorAll('.engine-card').forEach((card, index) => {
    const keys = ['valuation', 'momentum', 'quality', 'risk', 'macro', 'sentiment'];
    const heading = card.querySelector('h3');
    const question = card.querySelector('.engine-question');
    if (heading) heading.textContent = `${index + 1} · ${dictionary[keys[index]]}`;
    if (question) question.textContent = dictionary[`${keys[index]}Question`];
  });
  document.querySelector('#searchInput')?.setAttribute('aria-label', dictionary.searchLabel);
  document.querySelector('#marketFilter')?.setAttribute('aria-label', dictionary.market);
  document.querySelector('#pageSize')?.setAttribute('aria-label', dictionary.rowsPerPage);
}

function renderBacktest(data) {
  if (!data || !Array.isArray(data.equity_curve) || data.equity_curve.length < 2) return;
  const area = document.getElementById('backtestChartArea');
  const status = document.getElementById('backtestStatus');
  if (!area) return;
  const values = data.equity_curve.map((point) => Number(point.value));
  const min = Math.min(...values, 100);
  const max = Math.max(...values, 100);
  const spread = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 92 - ((value - min) / spread) * 82;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  area.querySelector('.chart-empty')?.remove();
  area.insertAdjacentHTML('afterbegin', `<svg class="backtest-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" /></svg>`);
  if (status) {
    status.textContent = `${data.stocks} stocks · ${data.return_pct >= 0 ? '+' : ''}${data.return_pct.toFixed(2)}%`;
    status.classList.add('data-ready');
  }
  const endLabel = document.getElementById('chartEndLabel');
  if (endLabel) endLabel.textContent = data.equity_curve[data.equity_curve.length - 1].date;
}

async function loadBacktest() {
  try {
    const response = await fetch(`backtest.json?cache=${Date.now()}`, { cache: 'reload' });
    if (response.ok) renderBacktest(await response.json());
  } catch (error) {
    // The explanatory empty state remains visible until history is available.
  }
}

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
    body.innerHTML = `<tr><td colspan="8" class="empty-state">${translate('noMatches')}</td></tr>`;
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
    resultCount.textContent = translate('showing')
      .replace('{start}', start + 1)
      .replace('{end}', Math.min(start + PAGE_SIZE, total))
      .replace('{total}', total);
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
    label.textContent = translate('refreshing');
    document.getElementById('refreshButton').disabled = true;
  } else {
    spinner.hidden = true;
    label.textContent = translate('refresh');
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
    document.getElementById('indexMeta').textContent = `${translate('asOf')} ${formatDate(data.date)}`;

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
    document.getElementById('indexMeta').textContent = translate('unavailable');

    const body = document.getElementById('rankingBody');
    const loadingRow = document.getElementById('loadingRow');
    if (loadingRow) loadingRow.remove();
    body.innerHTML =
      `<tr><td colspan="8" class="empty-state">` +
      `${translate('dataLoadError')} (${error.message}). ${translate('retry')}</td></tr>`;

    const pagination = document.getElementById('pagination');
    if (pagination) pagination.innerHTML = '';
    const resultCount = document.getElementById('resultCount');
    if (resultCount) resultCount.hidden = true;

    showError(
      `${translate('dataLoadError')} (${error.message}). ${translate('retry')}`,
    );
  } finally {
    setLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const languageToggle = document.getElementById('languageToggle');
  if (languageToggle) {
    languageToggle.addEventListener('click', () => {
      applyLanguage(currentLanguage === 'en' ? 'ko' : 'en');
    });
  }
  applyLanguage(currentLanguage);
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
  loadBacktest();
});
