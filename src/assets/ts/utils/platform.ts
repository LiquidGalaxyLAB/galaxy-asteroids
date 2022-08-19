/**
 * Defines whether the device is mobile.
 */
export const mobile =
  navigator?.userAgent.indexOf('Android') !== -1 ||
  navigator?.userAgent.indexOf('like Mac') !== -1
