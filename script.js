// script.js
console.log('script.js loaded');

// ← Your REST API Key from the “Accessing the API” tab
const API_KEY = '0fe49cfed728cedc398677d2f019d072';

// simple moving average over the last n closes
function sma(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(-n).reduce((sum, v) => sum + v, 0) / n;
}

// relative strength index over period days
function rsi(arr, period) {
  if (arr.length <= period) return null;
  const slice = arr.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i] - slice[i - 1];
    if (d > 0) gains += d;
    else losses -= d;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

async function fetchStock(sym) {
  sym = sym.toUpperCase();
  console.log('Fetching', sym);

  // 1) Live snapshot
  let snap;
  try {
    snap = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${0fe49cfed728cedc398677d2f019d072}`
    ).then(r => r.json());
    console.log('Snapshot response:', snap);
  } catch (err) {
    console.error('Snapshot fetch error', err);
    return alert('Network error fetching snapshot');
  }
  if (!snap.ticker) {
    console.warn('No data for', sym, snap);
    return alert(`No data for ${sym}`);
  }

  const t = snap.ticker;
  const price  = t.day.c;
  const prev   = t.prevDay.c;
  const change = price - prev;
  const pct    = t.todaysChangePerc * 100;
  const vol    = t.day.v;

  document.getElementById('symbolDisplay').textContent  = sym;
  document.getElementById('price').textContent          = price.toFixed(2);
  document.getElementById('change').textContent         = (change >= 0 ? '+' : '') + change.toFixed(2);
  document.getElementById('changePercent').textContent  = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  document.getElementById('volume').textContent         = vol.toLocaleString();

  // 2) 30‑day history for metrics & chart
  const end   = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  .toISOString().slice(0, 10);
  let aggs;
  try {
    aggs = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${start}/${end}?apiKey=${0fe49cfed728cedc398677d2f019d072}`
    ).then(r => r.json());
    console.log('Aggregates response:', aggs);
  } catch (err) {
    console.error('Aggregates fetch error', err);
    return;
  }

  const bars   = aggs.results || [];
  const closes = bars.map(b => b.c);
  const vols   = bars.map(b => b.v);

  // volume metrics
  const avgV = vols.reduce((a, b) => a + b, 0) / vols.length;
  const volΔ = ((vol - avgV) / avgV) * 100;
  document.getElementById('avgVolume').textContent        = Math.round(avgV).toLocaleString();
  document.getElementById('volChangePercent').textContent = (volΔ >= 0 ? '+' : '') + volΔ.toFixed(2) + '%';

  // SMA20 & RSI14
  document.getElementById('sma20').textContent = sma(closes, 20)?.toFixed(2) ?? '—';
  document.getElementById('rsi14').textContent = rsi(closes, 14)?.toFixed(2) ?? '—';

  // render chart
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bars.map(b => new Date(b.t).toLocaleDateString()),
      datasets: [{
        label: `${sym} Close`,
        data: closes,
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { display: false } }
    }
  });
}

// attach button handler
document.getElementById('fetchBtn').addEventListener('click', () => {
  const sym = document.getElementById('symbol').value.trim();
  if (sym) fetchStock(sym);
});

// initial load
window.addEventListener('load', () => fetchStock('AAPL'));
