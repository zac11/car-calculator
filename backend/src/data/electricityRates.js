// Approximate residential electricity tariffs (₹/kWh) by Indian state.
// These are coarse averages; in reality each state has slab-wise tariffs.
// Source inspiration: public tariff summaries such as [1] nobroker electricity-rate-per-unit-in-india,
// and government data sets [2] data.gov.in state-wise average rate of electricity.
//
// This is intended as a sane default; the UI still allows manual overrides.

const stateAverageRates = {
  delhi: 7,
  maharashtra: 10,
  karnataka: 8,
  tamilnadu: 7,
  "tamil nadu": 7,
  telangana: 8,
  andhra: 8,
  "andhra pradesh": 8,
  gujarat: 9,
  rajasthan: 7,
  haryana: 7,
  punjab: 6,
  "uttar pradesh": 8,
  bihar: 7,
  westbengal: 8,
  "west bengal": 8,
  kerala: 8,
  odisha: 7,
  chhattisgarh: 7,
  jharkhand: 7,
  assam: 7
};

function normalizeKey(value) {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getElectricityRate({ state, city }) {
  const stateKey = normalizeKey(state);
  const cityKey = normalizeKey(city);

  // Prefer state if we have a direct mapping
  if (stateKey && stateAverageRates[stateKey] != null) {
    return stateAverageRates[stateKey];
  }

  // Try a few loose matches by removing spaces (for inputs like "WestBengal")
  const compactStateKey = stateKey.replace(/\s+/g, "");
  if (compactStateKey && stateAverageRates[compactStateKey] != null) {
    return stateAverageRates[compactStateKey];
  }

  // In a more advanced version, we could look up by city using a richer dataset
  // or an external API keyed by pincode/utility.
  if (cityKey && stateAverageRates[cityKey] != null) {
    return stateAverageRates[cityKey];
  }

  return null;
}

module.exports = {
  getElectricityRate
};

