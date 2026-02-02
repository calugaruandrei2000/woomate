// storeMemory.js
const stores = {}; // obiect cu date pentru fiecare magazin

export function storeSubscription(storeId, plan) {
  if (!stores[storeId]) stores[storeId] = { metrics: {}, activity: [], plan: null };
  stores[storeId].plan = plan;
}

export function getSubscription(storeId) {
  return stores[storeId]?.plan || null;
}

export function storeAIActivity(storeId, message) {
  if (!stores[storeId]) stores[storeId] = { metrics: {}, activity: [], plan: null };
  stores[storeId].activity.push({ time: new Date().toISOString(), message });
}

export function storeSale(storeId, revenue = 0) {
  if (!stores[storeId]) stores[storeId] = { metrics: {}, activity: [], plan: null };
  stores[storeId].metrics.interactions = (stores[storeId].metrics.interactions || 0) + 1;
  stores[storeId].metrics.conversions = (stores[storeId].metrics.conversions || 0) + 1;
  stores[storeId].metrics.revenue = (stores[storeId].metrics.revenue || 0) + revenue;
}

export function getAIActivity(storeId) {
  return stores[storeId]?.activity || [];
}

export function getAIMetrics(storeId) {
  return stores[storeId]?.metrics || { interactions: 0, conversions: 0, revenue: 0 };
}
