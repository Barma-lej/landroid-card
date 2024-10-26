// Helpers file

/**
 * Checks if a value is an object.
 * @param {*} value The value to check.
 * @return {boolean} Whether the value is an object.
 */
export function isObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Convert WiFi signal strength (dBm) to WiFi Quality (%)
 * @param {number} rssi - WiFi signal strength in dBm
 * @return {string} WiFi quality as a percentage
 */
export function wifiStrenghtToQuality(rssi) {
  const qualityTable = {
    1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100,
    10: 100, 11: 100, 12: 100, 13: 100, 14: 100, 15: 100, 16: 100, 17: 100, 18: 100, 19: 100,
    20: 100, 21: 99, 22: 99, 23: 99, 24: 98, 25: 98, 26: 98, 27: 97, 28: 97, 29: 96,
    30: 96, 31: 95, 32: 95, 33: 94, 34: 93, 35: 93, 36: 92, 37: 91, 38: 90, 39: 90,
    40: 89, 41: 88, 42: 87, 43: 86, 44: 85, 45: 84, 46: 83, 47: 82, 48: 81, 49: 80,
    50: 79, 51: 78, 52: 76, 53: 75, 54: 74, 55: 73, 56: 71, 57: 70, 58: 69,59: 67,
    60: 66, 61: 64, 62: 63, 63: 61, 64: 60, 65: 58, 66: 56, 67: 55, 68: 53, 69: 51,
    70: 50, 71: 48, 72: 46, 73: 44, 74: 42, 75: 40, 76: 38, 77: 36, 78: 34, 79: 32,
    80: 30, 81: 28, 82: 26, 83: 24, 84: 22, 85: 20, 86: 17, 87: 15, 88: 13, 89: 10,
    90: 8, 91: 6,92: 3, 93: 1, 94: 1, 95: 1, 96: 1, 97: 1, 98: 1, 99: 1, 100: 1,
  };
  return rssi < 0 && rssi > -101 ? `${qualityTable[Math.abs(rssi)]} %` : '0 %';
}
