/** SSR-safe coarse-pointer/touch capability detection. */
export default function isTouchDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const points = Number(navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0);
  if (points > 0 || 'ontouchstart' in window) return true;

  if (typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia('(pointer: coarse)').matches
        || window.matchMedia('(any-pointer: coarse)').matches;
    } catch (error) {
      // Some old webviews expose matchMedia but reject pointer queries.
      return false;
    }
  }
  return false;
}

export { isTouchDevice };
