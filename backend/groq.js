import fetch from "node-fetch";

export async function askGroq(message) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are a professional AI sales assistant for an e-commerce store." },
        { role: "user", content: message }
      ]
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}
