// script.js
console.log('script.js loaded');

const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

// calculate simple moving average of last `period` closes
function calculateSMA(arr, period) {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

// calculate RSI over `period` days
function calculateRSI(arr, period) {
  if (arr.length <= period) return null;
  const slice = arr.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

async function fetchStock(symbol) {
  const sym = symbol.toUpperCase();
  console.log('Fetching data for', sym);
  const snapUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`;
  let data;
  try {
    const res = await fetch(snapUrl);
    data = await res.json();
    console.log('Snapshot response', data);
  } catch (err) {
    console.error('Network error', err);
    return alert('Network error fetching data');
  }

  if (!data.ticker) {
    console.warn('Invalid symbol or no data', data);
    return alert(`No data for “${sym}”`);
  }
  const t = data.ticker;
  const price = t.day.c;
  const prev  = t.prevDay.c;
  const change= price - prev;
  const pct   = t.todaysChangePerc * 100;
  const volume = t.day.v;

  document.getElementById('symbolDisplay').textContent  = sym;
  document.getElementById('price').textContent          = price.toFixed(2);
  document.getElementById('change').textContent         = `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  document.getElementById('changePercent').textContent  = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  document.getElementById('volume').textContent         = volume.toLocaleString();

  await loadHistoryAndMetrics(sym, volume);
}

async function loadHistoryAndMetrics(symbol, currentVolume) {
  const today = new Date();
  const end   = today.toISOString().slice(0,10);
  const start = new Date(today.setDate(today.getDate() - 30)).toISOString().slice(0,10);
  const aggsUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${start}/${end}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`;
  let aggsData;
  try {
    const res = await fetch(aggsUrl);
    aggsData = await res.json();
    console.log('Aggregates response', aggsData);
  } catch (err) {
    console.error('History fetch error', err);
    return;
  }
  const bars = aggsData.results || [];
  const closes = bars.map(b => b.c);
  const volumes= bars.map(b => b.v);

  // Volume metrics
  const avgVolume = volumes.reduce((a,v) => a + v, 0) / volumes.length;
  const volDeltaP = ((currentVolume - avgVolume) / avgVolume) * 100;
  document.getElementById('avgVolume').textContent        = Math.round(avgVolume).toLocaleString();
  document.getElementById('volChangePercent').textContent = `${volDeltaP >= 0 ? '+' : ''}${volDeltaP.toFixed(2)}%`;

  // Quant stats
  const sma20 = calculateSMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  document.getElementById('sma20').textContent = sma20 ? sma20.toFixed(2) : '—';
  document.getElementById('rsi14').textContent = rsi14 ? rsi14.toFixed(2) : '—';

  // Render chart
  const labels = bars.map(b => new Date(b.t).toLocaleDateString());
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: `${symbol} Close`, data: closes, borderWidth: 2, tension: 0.2 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  const input = document.getElementById('symbol');
  const btn   = document.getElementById('fetchBtn');
  if (!input || !btn) {
    return console.error('Missing #symbol or #fetchBtn in DOM');
  }
  btn.addEventListener('click', () => {
    const sym = input.value.trim().toUpperCase();
    console.log('Fetch clicked for', sym);
    if (sym) fetchStock(sym);
  });
  // initial fetch
  input.value = 'AAPL';
  console.log('Initial fetch for AAPL');
  fetchStock('AAPL');
});
