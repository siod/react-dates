interface LegacyNavigator extends Navigator {
  msMaxTouchPoints?: number;
}

export default function isTouchDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const legacyNavigator = navigator as LegacyNavigator;
  const points = Number(navigator.maxTouchPoints || legacyNavigator.msMaxTouchPoints || 0);
  if (points > 0 || 'ontouchstart' in window) return true;

  if (typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(pointer: coarse)').matches
        || window.matchMedia('(any-pointer: coarse)').matches;
    } catch {
      return false;
    }
  }
  return false;
}

export { isTouchDevice };
