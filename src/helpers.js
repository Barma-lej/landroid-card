// Helpers file

/**
 * Checking whether an object
 * @param {Object} Value to check
 * @return {Boolean}
 */
export function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
