// Helpers file

import * as consts from './constants';

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

/**
 * Resolves the image rendering mode from the `image` config value.
 *
 * @param {string|undefined} imageConfig - Raw `image` config value.
 * @return {'ha'|'bundled'|'url'} Rendering mode:
 *   'ha'      — standard animated HA status element (default),
 *   'bundled' — bundled landroid.svg,
 *   'url'     — user image URL or media-source:// link.
 */
export function resolveImageMode(imageConfig) {
  const image = imageConfig ?? consts.IMAGE_HA;
  if (image === consts.IMAGE_HA) return 'ha';
  if (image === consts.IMAGE_DEFAULT) return 'bundled';
  return 'url';
}

/**
 * Picks the HA status image element tag for the entity domain.
 *
 * @param {string|undefined} entityId - Main entity id.
 * @return {string} Custom element tag.
 */
export function resolveHaStateImageTag(entityId) {
  const domain = (entityId || '').split('.')[0];
  return (
    consts.HA_STATE_IMAGE_TAGS[domain] ||
    consts.HA_STATE_IMAGE_TAGS.lawn_mower
  );
}
