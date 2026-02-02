// Chat Widget profesional
const chatWidget = document.createElement('div');
chatWidget.id = 'ai-chat-widget';
chatWidget.innerHTML = `
  <div id="chat-header">Asistent AI</div>
  <div id="chat-body"></div>
  <input type="text" id="chat-input" placeholder="Scrie mesaj..."/>
`;
document.body.appendChild(chatWidget);

const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');

// Sesiune unica pentru fiecare client
const sessionId = localStorage.getItem('chatSessionId') || Math.random().toString(36).substr(2,9);
localStorage.setItem('chatSessionId', sessionId);

// Trimite mesaj la backend
async function sendMessage(message){
  chatBody.innerHTML += `<div><strong>Tu:</strong> ${message}</div>`;
  chatInput.value = '';

  try {
    // storeId va fi trimis de plugin-ul WooCommerce automat
    const storeId = window.__WOOMATE_STORE_ID || 'demo-store';

    const res = await fetch(`/chat`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ sessionId, storeId, message })
    });

    const data = await res.json();
    chatBody.innerHTML += `<div><strong>AI:</strong> ${data.reply}</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;
  } catch(err){
    chatBody.innerHTML += `<div><strong>AI:</strong> Eroare la comunicare</div>`;
  }
}

// Enter trimite mesaj
chatInput.addEventListener('keypress', e => {
  if(e.key === 'Enter' && chatInput.value.trim() !== '') sendMessage(chatInput.value.trim());
});

// Mesaj welcome
setTimeout(() => sendMessage('Salut! Sunt WooMate AI. Vrei să văd ce am făcut pentru magazinul tău?'), 1000);
