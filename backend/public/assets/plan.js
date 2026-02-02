async function subscribePlan(plan) {
  try {
    const res = await fetch('/subscribe', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ plan })
    });

    const data = await res.json();
    if(data.success) {
      alert(`Planul ${plan.toUpperCase()} activat! Funcționalitățile tale vor fi disponibile imediat.`);
      window.location.href = '/dashboard.html';
    } else {
      alert('A apărut o eroare la activarea planului.');
    }
  } catch(err){
    console.error('Eroare plan:', err);
    alert('Nu s-a putut procesa cererea.');
  }
}
