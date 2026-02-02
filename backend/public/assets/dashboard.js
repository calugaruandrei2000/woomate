const storeId = new URLSearchParams(window.location.search).get('store') || window.__WOOMATE_STORE_ID || 'demo-store';

async function fetchDashboard() {
  try {
    const res = await fetch(`/dashboard?store=${storeId}`);
    const data = await res.json();

    document.getElementById('totalInteractions').innerText = data.totalInteractions;
    document.getElementById('conversions').innerText = data.conversions;
    document.getElementById('revenueGenerated').innerText = data.revenueGenerated + ' Lei';

    const messagesEl = document.getElementById('aiMessages');
    messagesEl.innerHTML = '';
    data.aiMessages.forEach(msg => {
      const li = document.createElement('li');
      li.innerText = `[${msg.date}] ${msg.message}`;
      messagesEl.appendChild(li);
    });

  } catch(err) {
    console.error('Eroare la preluarea dashboard:', err);
  }
}

fetchDashboard();
setInterval(fetchDashboard, 5000); // update automat la 5 sec
