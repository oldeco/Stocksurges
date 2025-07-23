// script.js

// ← Replace this with your REST API Key from "Accessing the API"
const API_KEY = '	b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

(async function testPolygonKey() {
  const symbol = 'AAPL';
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${API_KEY}`
    );
    // HTTP-level errors
    if (!res.ok) {
      alert(`HTTP Error ${res.status}: ${res.statusText}`);
      return console.error(await res.text());
    }
    const data = await res.json();
    // API‑level errors
    if (data.error) {
      alert(`API Error: ${data.error}`);
      return console.error(data);
    }
    // Success!
    const price = data.ticker.day.c;
    alert(`✅ API Key works!\n${symbol} last price: $${price.toFixed(2)}`);
    console.log('Snapshot data:', data);
  } catch (err) {
    alert(`Network error: ${err.message}`);
    console.error(err);
  }
})();
