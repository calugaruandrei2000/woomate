const storeId = localStorage.getItem('storeId') || 'demo-store';
const activePlanEl = document.getElementById('active-plan');
const activityList = document.getElementById('activityList');

// Grafice Chart.js
let interactionsChart, conversionsChart, revenueChart;

async function fetchDashboard(){
  try {
    // Plan activ
    const planData = await fetch(`/get-plan?store=${storeId}`).then(r=>r.json());
    activePlanEl.innerHTML = `<h3>${planData.plan.toUpperCase()}</h3><p>Funcționalități active pentru planul tău.</p>`;

    // Date reale AI
    const data = await fetch(`/dashboard?store=${storeId}`).then(r=>r.json());

    // Activity log
    activityList.innerHTML = '';
    data.activity.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.time} → ${item.message}`;
      activityList.appendChild(li);
    });

    // Grafice animate
    const labels = data.metrics.map(m => m.date);
    const interactions = data.metrics.map(m => m.interactions);
    const conversions = data.metrics.map(m => m.conversions);
    const revenue = data.metrics.map(m => m.revenue);

    const ctxInteractions = document.getElementById('interactionsChart').getContext('2d');
    const ctxConversions = document.getElementById('conversionsChart').getContext('2d');
    const ctxRevenue = document.getElementById('revenueChart').getContext('2d');

    interactionsChart = new Chart(ctxInteractions, {
      type:'line',
      data:{ labels, datasets:[{label:'Interacțiuni', data:interactions, borderColor:'#007bff', backgroundColor:'rgba(0,123,255,0.2)'}] },
      options:{ responsive:true, animation:{duration:1000} }
    });

    conversionsChart = new Chart(ctxConversions, {
      type:'line',
      data:{ labels, datasets:[{label:'Conversii', data:conversions, borderColor:'#28a745', backgroundColor:'rgba(40,167,69,0.2)'}] },
      options:{ responsive:true, animation:{duration:1000} }
    });

    revenueChart = new Chart(ctxRevenue, {
      type:'line',
      data:{ labels, datasets:[{label:'Venit generat', data:revenue, borderColor:'#ffc107', backgroundColor:'rgba(255,193,7,0.2)'}] },
      options:{ responsive:true, animation:{duration:1000} }
    });

  } catch(err){
    console.error('Eroare dashboard:', err);
  }
}

// Refresh automat la fiecare 30s
fetchDashboard();
setInterval(fetchDashboard, 30000);
