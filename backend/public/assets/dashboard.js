const storeId = window.__WOOMATE_STORE_ID || 'demo-store';

// DOM Elements
const totalInteractionsEl = document.getElementById('totalInteractions');
const conversionsEl = document.getElementById('conversions');
const revenueEl = document.getElementById('revenueGenerated');
const messagesEl = document.getElementById('aiMessages');

// Chart.js canvases
const ctxProducts = document.getElementById('topProductsChart').getContext('2d');
const ctxTimeline = document.getElementById('salesTimelineChart').getContext('2d');

let topProductsChart = new Chart(ctxProducts, {
  type: 'bar',
  data: { labels: [], datasets: [{ label: 'Cantitate vândută', data: [], backgroundColor: '#007bff' }] },
  options: { responsive:true, plugins:{legend:{display:false}} }
});

let salesTimelineChart = new Chart(ctxTimeline, {
  type: 'line',
  data: { labels: [], datasets: [{ label:'Vânzări AI', data: [], borderColor:'#28a745', fill:false }] },
  options: { responsive:true, plugins:{legend:{display:true}} }
});

// Fetch data
async function fetchDashboard(){
  try {
    const res = await fetch(`/dashboard?store=${storeId}`);
    const data = await res.json();

    totalInteractionsEl.innerText = data.totalSales;
    conversionsEl.innerText = data.aiSales.length;
    revenueEl.innerText = data.totalRevenue + ' Lei';

    // Update AI logs
    messagesEl.innerHTML = '';
    data.aiSales.forEach(s => {
      const li = document.createElement('li');
      li.innerText = `[${s.date}] ${s.quantity} x ${s.product}`;
      messagesEl.appendChild(li);
    });

    // Top 5 produse
    const productMap = {};
    data.aiSales.forEach(s => {
      productMap[s.product] = (productMap[s.product] || 0) + s.quantity;
    });
    const sortedProducts = Object.entries(productMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    topProductsChart.data.labels = sortedProducts.map(p => p[0]);
    topProductsChart.data.datasets[0].data = sortedProducts.map(p => p[1]);
    topProductsChart.update();

    // Vanzari pe zile
    const salesByDate = {};
    data.aiSales.forEach(s => {
      const day = s.date.split(' ')[0];
      salesByDate[day] = (salesByDate[day] || 0) + s.quantity;
    });
    const sortedDates = Object.keys(salesByDate).sort();
    salesTimelineChart.data.labels = sortedDates;
    salesTimelineChart.data.datasets[0].data = sortedDates.map(d => salesByDate[d]);
    salesTimelineChart.update();

  } catch(err){
    console.error('Eroare dashboard:', err);
  }
}

// Initial fetch + refresh la 5 secunde
fetchDashboard();
setInterval(fetchDashboard, 5000);
