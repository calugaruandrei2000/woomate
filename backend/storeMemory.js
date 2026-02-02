const storeData = {};

export function storeMessage(storeId, sessionId, message) {
  if (!storeData[storeId]) storeData[storeId] = { sessions: {}, sales: [] };
  if (!storeData[storeId].sessions[sessionId]) storeData[storeId].sessions[sessionId] = [];
  storeData[storeId].sessions[sessionId].push({ message, date: new Date().toLocaleString() });
}

export function storeSale(storeId, orderId, aiGenerated) {
  if (!storeData[storeId]) storeData[storeId] = { sessions: {}, sales: [] };
  storeData[storeId].sales.push({ orderId, aiGenerated, date: new Date().toLocaleString() });
}

export function getSession(storeId) {
  if (!storeData[storeId]) return { totalSales: 0, totalRevenue: 0, aiSales: [] };

  let totalSales = 0;
  let totalRevenue = 0;
  const aiSales = [];

  for (const sale of storeData[storeId].sales) {
    sale.aiGenerated.forEach(item => {
      totalSales += item.quantity;
      totalRevenue += item.quantity * 100; // aici poți lua prețul real din plugin dacă vrei
      aiSales.push({ product: item.product, quantity: item.quantity, date: sale.date });
    });
  }

  return { totalSales, totalRevenue, aiSales };
}
