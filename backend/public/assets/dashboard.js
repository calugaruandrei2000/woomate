async function fetchDashboard() {
  try {
    const storeId = 'demo-store'; // Aici plugin-ul va trimite store ID real
    const res = await fetch(`/dashboard?store=${storeId}`);
    const data = await res.json();

    // Update statistici
    document.getElementById('totalInteractions').textContent = data.totalInteractions;
    document.getElementById('conversions').textContent = data.conversions;
    document.getElementById('revenue').textContent = data.revenueGenerated + " lei";

    // Mesaje AI
    const messagesList = document.getElementById('aiMessages');
    data.aiMessages.forEach(msg => {
      const li = document.createElement('li');
      li.textContent = `${msg.date}: ${msg.message}`;
      messagesList.appendChild(li);
    });

    // Chart conversii
    const ctx = document.getElementById('conversionsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.aiMessages.map(m => m.date),
        datasets: [{
          label: 'Conversii',
          data: data.aiMessages.map((m, i) => i+1), // pentru MVP
          borderColor: '#0a2540',
          backgroundColor: 'rgba(10,37,64,0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true }
    });

  } catch (err) {
    console.error("Eroare la fetch dashboard:", err);
  }
}

fetchDashboard();
