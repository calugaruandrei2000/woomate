// pluginData.js
const packages = {
  trial: ["Interacțiuni AI limitate", "Dashboard demo"],
  starter: ["Interacțiuni AI", "Dashboard magazin", "Funcționalități esențiale"],
  pro: ["Toate funcționalitățile AI", "Dashboard complet", "Analize și raportare"],
  business: ["Toate funcționalitățile", "Dashboard complet", "Suport prioritar"]
};

const storePlugins = {}; // ce magazin are ce pachet

export function activatePlugin(storeId, plan) {
  storePlugins[storeId] = packages[plan] || packages['trial'];
  return storePlugins[storeId];
}

export function getStoreFeatures(storeId) {
  return storePlugins[storeId] || [];
}
