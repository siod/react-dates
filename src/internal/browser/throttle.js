/** A small lodash-compatible throttle with explicit cancellation. */
export default function throttle(func, wait = 0, options = {}) {
  if (typeof func !== 'function') throw new TypeError('throttle expects a function');
  const delay = Math.max(0, Number(wait) || 0);
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  let timeout = null;
  let previous = 0;
  let args;
  let context;
  let result;

  const later = () => {
    previous = leading ? Date.now() : 0;
    timeout = null;
    if (trailing && args) {
      result = func.apply(context, args);
      args = context = undefined;
    } else {
      args = context = undefined;
    }
  };

  function throttled(...nextArgs) {
    const now = Date.now();
    if (!previous && !leading) previous = now;
    const remaining = delay - (now - previous);
    args = nextArgs;
    context = this;
    if (remaining <= 0 || remaining > delay) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      args = context = undefined;
    } else if (!timeout && trailing) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  }

  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    previous = 0;
    args = context = undefined;
  };
  throttled.flush = () => {
    if (!timeout) return result;
    clearTimeout(timeout);
    later();
    return result;
  };
  return throttled;
}
