console.log('script.js loaded');

// ← PASTE your REST API KEY from the “Accessing the API” tab here
const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

// Simple moving average
function sma(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(-n).reduce((sum, v) => sum + v, 0) / n;
}

// 14‑day RSI
function rsi(arr, period) {
  if (arr.length <= period) return null;
  const slice = arr.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i] - slice[i - 1];
    if (d > 0) gains += d;
    else losses -= d;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - (100 / (1 + rs));
}

async function fetchStock(sym) {
  sym = sym.toUpperCase();
  console.log('Fetching', sym);

  // 1) Last trade price
  let last;
  try {
    last = await fetch(
      `https://api.polygon.io/v2/last/trade/${sym}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`
    ).then(r => r.json());
    console.log('Last trade:', last);
  } catch {
    return alert('Network error fetching last trade');
  }
  if (!last.results?.last?.price) {
    return alert(`No trade data for ${sym}`);
  }
  const price = last.results.last.price;

  // 2) Yesterday’s bar for prev-close & volume
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0,10);
  let dayBar;
  try {
    const barRes = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${yesterday}/${yesterday}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`
    ).then(r => r.json());
    dayBar = barRes.results?.[0];
    console.log('Yesterday bar:', barRes);
  } catch {
    return alert('Network error fetching previous day');
  }
  if (!dayBar) {
    return alert(`No historical data for ${sym}`);
  }
  const prevClose = dayBar.c;
  const prevVol   = dayBar.v;

  // Calculate change & fill UI
  const change = price - prevClose;
  const pct    = (change / prevClose) * 100;

  document.getElementById('symbolDisplay').textContent  = sym;
  document.getElementById('price').textContent          = price.toFixed(2);
  document.getElementById('change').textContent         = (change >= 0 ? '+' : '') + change.toFixed(2);
  document.getElementById('changePercent').textContent  = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  document.getElementById('volume').textContent         = prevVol.toLocaleString();

  // 3) 30‑day history for metrics & chart
  const end   = yesterday;
  const start = new Date(Date.now() - 30*864e5).toISOString().slice(0,10);
  let aggs;
  try {
    aggs = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${start}/${end}?apiKey=${API_KEY}`
    ).then(r => r.json());
    console.log('30d aggs:', aggs);
  } catch {
    return alert('Network error fetching history');
  }
  const bars   = aggs.results || [];
  const closes = bars.map(b => b.c);
  const vols   = bars.map(b => b.v);

  // Volume metrics
  const avgV   = vols.reduce((a,b) => a + b, 0) / vols.length;
  const volΔp  = ((prevVol - avgV) / avgV) * 100;
  document.getElementById('avgVolume').textContent        = Math.round(avgV).toLocaleString();
  document.getElementById('volChangePercent').textContent = (volΔp >= 0 ? '+' : '') + volΔp.toFixed(2) + '%';

  // Indicators
  document.getElementById('sma20').textContent = sma(closes, 20)?.toFixed(2) ?? '—';
  document.getElementById('rsi14').textContent = rsi(closes, 14)?.toFixed(2) ?? '—';

  // Draw chart
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bars.map(b => new Date(b.t).toLocaleDateString()),
      datasets: [{ label: `${sym} Close`, data: closes, borderWidth:2, tension:0.3 }]
    },
    options: { maintainAspectRatio:false, responsive:true, scales:{ x:{ display:false } } }
  });
}

// Hook up button + initial load
document.getElementById('fetchBtn').addEventListener('click', () => {
  const s = document.getElementById('symbol').value.trim();
  if (s) fetchStock(s);
});
window.addEventListener('load', () => fetchStock('AAPL'));
