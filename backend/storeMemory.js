// Stocare mesaje și sesiuni pe magazin
const storeData = {};

export function storeMessage(storeId, sessionId, message) {
  if (!storeData[storeId]) storeData[storeId] = {};
  if (!storeData[storeId][sessionId]) storeData[storeId][sessionId] = [];
  storeData[storeId][sessionId].push({ message, date: new Date().toLocaleString() });
}

export function getSession(storeId) {
  if (!storeData[storeId]) return { totalInteractions: 0, conversions: 0, revenueGenerated: 0, aiMessages: [] };
  
  let totalInteractions = 0;
  const aiMessages = [];

  for (const session of Object.values(storeData[storeId])) {
    totalInteractions += session.length;
    aiMessages.push(...session.map(msg => ({ message: msg.message, date: msg.date })));
  }

  return {
    totalInteractions,
    conversions: Math.floor(totalInteractions / 3), // exemplu: 1 conversie la 3 interacțiuni
    revenueGenerated: Math.floor(totalInteractions * 15), // exemplu: 15 lei pe conversie
    aiMessages
  };
}
