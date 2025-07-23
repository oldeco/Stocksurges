// script.js
console.log('script.js loaded');

const API_KEY = '0fe49cfed728cedc398677d2f019d072';

// simple moving average over last n values
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

  // 1) Get latest trade price
  let lastData;
  try {
    lastData = await fetch(
      `https://api.polygon.io/v1/last/stocks/${sym}?apiKey=${API_KEY}`
    ).then(r => r.json());
    console.log('Last trade response:', lastData);
  } catch (err) {
    console.error('Last-trade fetch error', err);
    return alert('Network error fetching last trade');
  }
  if (!lastData.last || !lastData.last.price) {
    alert(`No trade data for ${sym}`);
    return;
  }
  const price = lastData.last.price;

  // 2) Get previous close & yesterday's volume
  const yesterday = new Date(Date.now() - 24*60*60*1000)
                      .toISOString().slice(0,10);
  let ocData;
  try {
    ocData = await fetch(
      `https://api.polygon.io/v1/open-close/${sym}/${yesterday}?apiKey=${API_KEY}`
    ).then(r => r.json());
    console.log('Open-close response:', ocData);
  } catch (err) {
    console.error('Open-close fetch error', err);
    return alert('Network error fetching prev-close');
  }
  if (ocData.status !== 'OK') {
    alert(`No open-close data for ${sym}`);
    return;
  }
  const prevClose = ocData.close;
  const volume    = ocData.volume;

  // compute change & % change
  const change = price - prevClose;
  const pct    = (change / prevClose) * 100;

  // update DOM
  document.getElementById('symbolDisplay').textContent = sym;
  document.getElementById('price').textContent         = price.toFixed(2);
  document.getElementById('change').textContent        = (change >= 0 ? '+' : '') + change.toFixed(2);
  document.getElementById('changePercent').textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
  document.getElementById('volume').textContent        = volume.toLocaleString();

  // 3) Fetch 30-day history for metrics & chart
  const end   = yesterday;
  const start = new Date(Date.now() - 30*24*60*60*1000)
                      .toISOString().slice(0,10);
  let aggs;
  try {
    aggs = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${start}/${end}?apiKey=${API_KEY}`
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
  const avgVolume  = vols.reduce((a, b) => a + b, 0) / vols.length;
  const volDeltaP  = ((volume - avgVolume) / avgVolume) * 100;

  document.getElementById('avgVolume').textContent        = Math.round(avgVolume).toLocaleString();
  document.getElementById('volChangePercent').textContent = (volDeltaP >= 0 ? '+' : '') + volDeltaP.toFixed(2) + '%';

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

document.getElementById('fetchBtn').addEventListener('click', () => {
  const sym = document.getElementById('symbol').value.trim();
  if (sym) fetchStock(sym);
});

// initial load
window.addEventListener('load', () => fetchStock('AAPL'));
