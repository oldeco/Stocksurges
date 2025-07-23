// script.js

// ← your provided key
const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

// calculate simple moving average of last `period` closes
function calculateSMA(arr, period) {
  if (arr.length < period) return null;
  const slice = arr.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return sum / period;
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
  const snapUrl = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`;
  let data;
  try {
    const res = await fetch(snapUrl);
    data = await res.json();
  } catch (err) {
    console.error(err);
    return alert('Network error fetching data');
  }

  if (!data.results) {
    console.warn('Full response:', data);
    return alert(`No data for “${symbol.toUpperCase()}”`);
  }
  const t = data.results;

  // today vs prev close
  const price   = t.day.c;
  const prev    = t.prevDay.c;
  const change  = price - prev;
  const pct     = t.todaysChangePerc * 100;
  const volume  = t.day.v;

  document.getElementById('symbolDisplay').textContent = symbol.toUpperCase();
  document.getElementById('price').textContent         = price.toFixed(2);
  document.getElementById('change').textContent        = `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  document.getElementById('changePercent').textContent = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  document.getElementById('volume').textContent        = volume.toLocaleString();

  // pull history & compute volume metrics + quant stats
  await loadHistoryAndMetrics(symbol, volume);
}

async function loadHistoryAndMetrics(symbol, currentVolume) {
  const today = new Date();
  const end   = today.toISOString().slice(0,10);
  const start = new Date(today.setDate(today.getDate() - 30)).toISOString().slice(0,10);
  const aggsUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${start}/${end}?apiKey=${API_KEY}`;
  const aggsRes = await fetch(aggsUrl);
  const aggsData = await aggsRes.json();
  const bars = aggsData.results || [];

  const closes = bars.map(b => b.c);
  const volumes = bars.map(b => b.v);

  // volume metrics
  const avgVolume = volumes.reduce((a, v) => a + v, 0) / volumes.length;
  const volDeltaP = ((currentVolume - avgVolume) / avgVolume) * 100;

  document.getElementById('avgVolume').textContent        = Math.round(avgVolume).toLocaleString();
  document.getElementById('volChangePercent').textContent = `${volDeltaP >= 0 ? '+' : ''}${volDeltaP.toFixed(2)}%`;

  // quant stats
  const sma20 = calculateSMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);

  document.getElementById('sma20').textContent = sma20 ? sma20.toFixed(2) : '—';
  document.getElementById('rsi14').textContent = rsi14 ? rsi14.toFixed(2) : '—';

  // price chart
  const labels = bars.map(b => new Date(b.t).toLocaleDateString());
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: `${symbol.toUpperCase()} Close`,
        data: closes,
        borderWidth: 2,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { display: false } }
    }
  });
}

document.getElementById('fetchBtn').onclick = () => {
  const sym = document.getElementById('symbol').value.trim();
  if (sym) fetchStock(sym);
};

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('symbol').value = 'AAPL';
  fetchStock('AAPL');
});
