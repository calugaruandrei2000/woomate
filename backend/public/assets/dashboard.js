// Simulare fetch date backend
async function fetchDashboard() {
  try {
    // Exemplu endpoint real: `/dashboard?store=URL`
    // Pentru MVP simulăm date
    const data = {
      conversions: [5, 10, 7, 12, 9, 15, 11],
      days: ['Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă','Duminică'],
      topProducts: ['Parfum A', 'Parfum B', 'Crema X', 'Roll-on Y'],
      avgCart: 225
    };

    // Chart conversii
    const ctx = document.getElementById('conversionsChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.days,
        datasets: [{
          label: 'Conversii / zi',
          data: data.conversions,
          borderColor: '#0a2540',
          backgroundColor: 'rgba(10,37,64,0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      }
    });

    // Top produse
    const topList = document.getElementById('topProducts');
    data.topProducts.forEach(prod => {
      const li = document.createElement('li');
      li.textContent = prod;
      topList.appendChild(li);
    });

    // Valoare medie cos
    document.getElementById('avgCart').textContent = data.avgCart + " lei";

  } catch (err) {
    console.error("Eroare la fetch dashboard:", err);
  }
}

// Rulare fetch la load
fetchDashboard();
