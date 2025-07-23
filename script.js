// script.js
console.log('script.js loaded');

const API_KEY = 'b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded. API_KEY is:', b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB);

  const btn = document.getElementById('fetchBtn');
  if (!btn) {
    console.error('❌ Missing #fetchBtn element');
    return;
  }

  btn.addEventListener('click', () => {
    const sym = document.getElementById('symbol')?.value.trim().toUpperCase();
    console.log('Fetch clicked for', sym);
    alert(`✅ Button works\nAPI_KEY = ${b9pUWqpiaRl96K9b2EOpNePWZ2TCiALB}\nSymbol = ${sym}`);
  });
});
