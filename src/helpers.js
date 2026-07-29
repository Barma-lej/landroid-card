// Helpers file

/**
 * Checks if a value is an object.
 * @param {*} value The value to check.
 * @return {boolean} Whether the value is an object.
 */
export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Convert WiFi signal strength (dBm) to WiFi Quality (%)
 * @param {number} rssi - WiFi signal strength in dBm
 * @return {string} WiFi quality as a percentage
 */
export function wifiStrengthToQuality(rssi) {
  const normalizedRssi = rssi > 0 ? -rssi : rssi; // Превращаем 62 в -62
  const rssiNum = parseFloat(normalizedRssi);
  
  if (isNaN(rssiNum)) return `0 %`;
  if (rssiNum >= -30) return `100 %`;
  if (rssiNum <= -100) return `1 %`;
  
  return `${Math.round((rssiNum + 100) / 0.7)} %`;
}
