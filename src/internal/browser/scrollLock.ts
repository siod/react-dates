interface ScrollLockState {
  count: number;
  overflow: string;
}

const locks = new WeakMap<HTMLElement, ScrollLockState>();

function targetElement(target?: HTMLElement | null) {
  if (target) return target;
  if (typeof document === 'undefined') return null;
  const scrollingElement = document.scrollingElement;
  return scrollingElement instanceof HTMLElement
    ? scrollingElement
    : document.documentElement || document.body;
}

export default function lockScroll(target?: HTMLElement | null) {
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
export const enableScroll = (cleanup?: (() => void) | null) => {
  if (typeof cleanup === 'function') cleanup();
};
