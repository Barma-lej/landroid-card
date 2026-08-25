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

// ─── Domain layer (lawn_mower / vacuum) ─────────────────────────────────────

/**
 * Returns the domain of an entity id.
 *
 * @param {string|undefined} entityId - e.g. 'vacuum.roborock'.
 * @return {string} The domain, e.g. 'vacuum'. Empty string for empty input.
 */
export function getEntityDomain(entityId) {
  return (entityId || '').split('.')[0];
}

/**
 * Checks whether an entity id belongs to a domain supported by the card.
 *
 * @param {string|undefined} entityId
 * @return {boolean}
 */
export function isSupportedEntity(entityId) {
  return consts.SUPPORTED_DOMAINS.includes(getEntityDomain(entityId));
}

/**
 * Resolves a canonical card action ('start_mowing', 'pause', 'dock', 'stop'…)
 * to the actual HA service name for the given domain.
 * Unknown actions/domains fall through unchanged.
 *
 * @param {string} domain - 'lawn_mower' or 'vacuum'.
 * @param {string} action - Canonical action key.
 * @return {string} Service name, e.g. 'return_to_base'.
 */
export function resolveService(domain, action) {
  return consts.DOMAIN_SERVICE_MAP[domain]?.[action] ?? action;
}

/**
 * Checks a supported_features bitmask for a domain feature flag.
 *
 * Rules:
 * - bitmask empty/undefined (legacy integrations) → true (don't hide buttons);
 * - unknown domain → true;
 * - flag not present in the domain model → false (feature doesn't exist there);
 * - otherwise → bit check.
 *
 * @param {string} domain - 'lawn_mower' or 'vacuum'.
 * @param {number|undefined|null} features - supported_features attribute.
 * @param {string} flag - Feature key from DOMAIN_FEATURES, e.g. 'PAUSE'.
 * @return {boolean}
 */
export function supportsFeature(domain, features, flag) {
  if (!features) return true;           // нет битмаски — обратная совместимость
  const domainFeatures = consts.DOMAIN_FEATURES[domain];
  if (!domainFeatures) return true;     // неизвестный домен — не скрываем
  const bit = domainFeatures[flag];
  if (bit === undefined) return false;  // фича отсутствует в домене — скрываем
  return (features & bit) !== 0;
}
