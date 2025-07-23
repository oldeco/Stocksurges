// script.js

// ← Replace this with your REST API Key from "Accessing the API"
const API_KEY = 'cae0e07e-aaba-46b6-aa4c-db31331f22fb';

(async function testPolygonKey() {
  const symbol = 'AAPL';
  try {
    const res = await fetch(
      `https://files.polygon.io/${symbol}?apiKey=${API_KEY}`
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
