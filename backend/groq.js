// Wrapper pentru API Groq
import fetch from 'node-fetch';

const GROQ_API_KEY = process.env.GROQ_API_KEY; // cheia ta secretă

export async function queryGroq(prompt) {
  const res = await fetch('https://api.groq.com/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({ prompt })
  });

  const data = await res.json();
  return data.response || "Nu am putut genera răspuns";
}
