const locks = new WeakMap();

function targetElement(target) {
  if (target) return target;
  if (typeof document === 'undefined') return null;
  return document.scrollingElement || document.documentElement || document.body;
}

/** Lock overflow on an element and restore it when the idempotent cleanup runs. */
export default function lockScroll(target) {
  const element = targetElement(target);
  if (!element?.style) return () => {};
  const existing = locks.get(element);
  if (existing) {
    existing.count += 1;
  } else {
    locks.set(element, { count: 1, overflow: element.style.overflow });
    element.style.overflow = 'hidden';
  }
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const lock = locks.get(element);
    if (!lock) return;
    lock.count -= 1;
    if (lock.count === 0) {
      element.style.overflow = lock.overflow;
      locks.delete(element);
    }
  };
}

export const disableScroll = lockScroll;
export const enableScroll = (cleanup) => {
  if (typeof cleanup === 'function') cleanup();
};
