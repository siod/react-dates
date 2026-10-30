export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottledFunction<Arguments extends unknown[], Result> {
  (...arguments_: Arguments): Result | undefined;
  cancel: () => void;
  flush: () => Result | undefined;
}

export default function throttle<Context, Arguments extends unknown[], Result>(
  func: (this: Context, ...arguments_: Arguments) => Result,
  wait = 0,
  options: ThrottleOptions = {},
): ThrottledFunction<Arguments, Result> {
  if (typeof func !== 'function') throw new TypeError('throttle expects a function');
  const delay = Math.max(0, Number(wait) || 0);
  const leading = options.leading !== false;
  const trailing = options.trailing !== false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;
  let pending: { arguments_: Arguments; context: Context } | undefined;
  let result: Result | undefined;

  const invoke = () => {
    if (!pending) return result;
    result = func.apply(pending.context, pending.arguments_);
    pending = undefined;
    return result;
  };

  const later = () => {
    previous = leading ? Date.now() : 0;
    timeout = null;
    if (trailing && pending) invoke();
    else pending = undefined;
  };

  function throttled(this: Context, ...nextArguments: Arguments) {
    const now = Date.now();
    if (!previous && !leading) previous = now;
    const remaining = delay - (now - previous);
    pending = { arguments_: nextArguments, context: this };
    if (remaining <= 0 || remaining > delay) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      invoke();
    } else if (!timeout && trailing) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  }

  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    previous = 0;
    pending = undefined;
  };
  throttled.flush = () => {
    if (!timeout) return result;
    clearTimeout(timeout);
    later();
    return result;
  };
  return throttled;
}
