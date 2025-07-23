console.log('script.js loaded');

const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

// dummy fetchStock that returns a Promise
async function fetchStock(sym) {
  // simulate your real logic here…
  const response = await fetch(
    `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${sym}?apiKey=${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}`
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (!data.ticker) throw new Error('No ticker data returned');
  // …then your DOM updates go here…
  return data.ticker;
}

// Wire up the button
const btn = document.getElementById('fetchBtn');
if (!btn) {
  alert('❌ Missing #fetchBtn in DOM');
} else {
  btn.addEventListener('click', () => {
    alert('✅ Fetch button clicked');    // confirms click handler is working
    const input = document.getElementById('symbol');
    const sym = input ? input.value.trim().toUpperCase() : '';
    if (!sym) {
      return alert('⚠️ Please enter a ticker symbol');
    }
    fetchStock(sym)
      .then(t => {
        alert(`🎉 fetchStock succeeded for ${sym}\nPrice: ${t.day.c.toFixed(2)}`);
      })
      .catch(err => {
        console.error(err);
        alert(`❗️ fetchStock error: ${err.message}`);
      });
  });
}
