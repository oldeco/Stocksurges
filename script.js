// script.js
console.log('script.js loaded');

// ← REPLACE this with your REST API key from "Accessing the API" tab
const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

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
    if (d > 0) gains += d; else losses -= d;
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

  // 1) Snapshot endpoint for live price, prev-day close, % change & volume
  let snap;
  try {
    snap = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${API_KEY}`
    ).then(r => r.json());
    console.log('Snapshot:', snap);
  } catch {
    return alert('Network error loading snapshot');
  }
  if (!snap.ticker) {
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
  document.getElementById('change').textContent         = (change>=0?'+':'')+change.toFixed(2);
  document.getElementById('changePercent').textContent  = (pct>=0?'+':'')+pct.toFixed(2)+'%';
  document.getElementById('volume').textContent         = vol.toLocaleString();

  // 2) Aggregates endpoint for 30‑day history
  const end   = new Date().toISOString().slice(0,10);
  const start = new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10);
  let aggs;
  try {
    aggs = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${start}/${end}?apiKey=${API_KEY}`
    ).then(r => r.json());
    console.log('Aggregates:', aggs);
  } catch {
    return alert('Network error loading history');
  }

  const bars   = aggs.results || [];
  const closes = bars.map(b => b.c);
  const volsArr= bars.map(b => b.v);

  // volume metrics
  const avgV  = volsArr.reduce((a,b)=>a+b,0)/volsArr.length;
  const volΔp = ((vol - avgV)/avgV)*100;
  document.getElementById('avgVolume').textContent        = Math.round(avgV).toLocaleString();
  document.getElementById('volChangePercent').textContent = (volΔp>=0?'+':'')+volΔp.toFixed(2)+'%';

  // SMA20 & RSI14
  document.getElementById('sma20').textContent = sma(closes,20)?.toFixed(2) ?? '—';
  document.getElementById('rsi14').textContent = rsi(closes,14)?.toFixed(2) ?? '—';

  // draw chart
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bars.map(b => new Date(b.t).toLocaleDateString()),
      datasets: [{ label:`${sym} Close`, data: closes, borderWidth:2, tension:0.3 }]
    },
    options: { responsive:true, maintainAspectRatio:false, scales:{ x:{ display:false } } }
  });
}

// wire up button
document.getElementById('fetchBtn').addEventListener('click', () => {
  const s = document.getElementById('symbol').value.trim();
  if (s) fetchStock(s);
});

// initial load
window.addEventListener('load', () => fetchStock('AAPL'));
