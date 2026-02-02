import fetch from 'node-fetch';

export async function handleGroqChat(history, storeUrl) {
  if (!process.env.GROQ_API_KEY) {
    return "AI-ul este temporar indisponibil (lipsă configurare).";
  }

  const messages = [
    {
      role: "system",
      content: `Ești un AI assistant pentru magazine online. Ajută clientul să cumpere mai ușor.`
    },
    ...history
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Nu am un răspuns acum.";
  } catch (err) {
    console.error("Groq error:", err);
    return "Eroare AI temporară.";
  }
}
