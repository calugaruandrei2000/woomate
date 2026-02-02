const storeId = window.__WOOMATE_STORE_ID || 'demo-store';
async function fetchDashboard() {
  try {
    const res = await fetch(`/dashboard?store=${storeId}`);
    const data = await res.json();

    document.getElementById('totalInteractions').innerText = data.totalSales;
    document.getElementById('conversions').innerText = data.aiSales.length;
    document.getElementById('revenueGenerated').innerText = data.totalRevenue + ' Lei';

    const messagesEl = document.getElementById('aiMessages');
    messagesEl.innerHTML = '';
    data.aiSales.forEach(msg => {
      const li = document.createElement('li');
      li.innerText = `[${msg.date}] ${msg.quantity} x ${msg.product}`;
      messagesEl.appendChild(li);
    });

    // Chart.js
    if(window.salesChart){
      salesChart.data.labels = data.aiSales.map(s => s.date);
      salesChart.data.datasets[0].data = data.aiSales.map(s => s.quantity);
      salesChart.update();
    }
  } catch(err){
    console.error('Eroare la preluarea dashboard:', err);
  }
}

fetchDashboard();
setInterval(fetchDashboard, 5000);

// Chart.js - top produse
const ctx = document.createElement('canvas');
document.body.appendChild(ctx);
const salesChart = new Chart(ctx, {
  type: 'line',
  data: { labels: [], datasets:[{label:'Produse vândute AI', data: [], borderColor:'#007bff', fill:false}] },
  options: { responsive:true, plugins:{legend:{display:true}} }
});
