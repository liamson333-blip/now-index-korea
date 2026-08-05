const samplePrices = [700000, 120000];

function computeIndex(prices) {
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function formatValue(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function updateIndex() {
  const indexValue = computeIndex(samplePrices);
  const indexElement = document.getElementById('indexValue');
  indexElement.textContent = formatValue(indexValue);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refreshButton').addEventListener('click', updateIndex);
  updateIndex();
});
