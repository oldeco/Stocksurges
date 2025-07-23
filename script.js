console.log('script.js loaded');

const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

function sma(arr, n) {
  if (arr.length < n) return null;
  return arr.slice(-n).reduce((a,b)=>a+b,0)/n;
}

function rsi(arr, period) {
  if (arr.length <= period) return null;
  const slice = arr.slice(-period-1);
  let gains=0, losses=0;
  for (let i=1; i<slice.length; i++) {
    const d = slice[i] - slice[i-1];
    if (d>0) gains+=d; else losses-=d;
  }
  const avgG = gains/period, avgL = losses/period;
  if (avgL===0) return 100;
  const rs = avgG/avgL;
  return 100 - (100/(1+rs));
}

async function fetchStock(sym) {
  sym = sym.toUpperCase();
  console.log('Fetching', sym);

  // Snapshot
  const snap = await fetch(
    `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`
  ).then(r=>r.json());
  if (!snap.ticker) {
    alert(`No data for ${sym}`);
    console.warn(snap);
    return;
  }
  const t = snap.ticker;
  const price = t.day.c, prev = t.prevDay.c, change = price-prev, pct = t.todaysChangePerc*100, vol = t.day.v;

  document.getElementById('symbolDisplay').textContent  = sym;
  document.getElementById('price').textContent          = price.toFixed(2);
  document.getElementById('change').textContent         = (change>=0?'+':'')+change.toFixed(2);
  document.getElementById('changePercent').textContent  = (pct>=0?'+':'')+pct.toFixed(2)+'%';
  document.getElementById('volume').textContent         = vol.toLocaleString();

  // Aggregates (30d history)
  const now = new Date(), end = now.toISOString().slice(0,10);
  now.setDate(now.getDate()-30);
  const start = now.toISOString().slice(0,10);
  const aggs = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${start}/${end}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`
  ).then(r=>r.json());
  const bars = aggs.results||[], closes = bars.map(b=>b.c), vols = bars.map(b=>b.v);

  const avgV = vols.reduce((a,b)=>a+b,0)/vols.length;
  const volΔ = ((vol - avgV)/avgV)*100;

  document.getElementById('avgVolume').textContent        = Math.round(avgV).toLocaleString();
  document.getElementById('volChangePercent').textContent = (volΔ>=0?'+':'')+volΔ.toFixed(2)+'%';
  document.getElementById('sma20').textContent            = sma(closes,20)?.toFixed(2) ?? '—';
  document.getElementById('rsi14').textContent            = rsi(closes,14)?.toFixed(2) ?? '—';

  // Chart
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.stockChart) window.stockChart.destroy();
  window.stockChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: bars.map(b=>new Date(b.t).toLocaleDateString()),
      datasets: [{ label: `${sym} Close`, data: closes, borderWidth: 2, tension: 0.3 }]
    },
    options: { maintainAspectRatio:false, responsive:true, scales:{ x:{ display:false } } }
  });
}

document.getElementById('fetchBtn').onclick = () => {
  const sym = document.getElementById('symbol').value.trim();
  if (sym) fetchStock(sym);
};

// initial load
window.addEventListener('load', () => fetchStock('AAPL'));
