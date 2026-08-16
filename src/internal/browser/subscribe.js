/**
 * Subscribe to a DOM event without retaining a listener after cleanup.
 * The returned function is deliberately idempotent: React Strict Mode may
 * invoke an effect cleanup more than once while probing an effect.
 */
export function subscribe(target, type, listener, options) {
  if (!target || typeof target.addEventListener !== 'function' || typeof listener !== 'function') {
    return () => {};
  }

  target.addEventListener(type, listener, options);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    target.removeEventListener(type, listener, options);
  };
}

export const addEventListener = subscribe;
export default subscribe;
