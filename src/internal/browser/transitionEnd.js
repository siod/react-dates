export default function isTransitionEndSupported() {
  return typeof window !== 'undefined' && 'TransitionEvent' in window;
}

export function onTransitionEnd(target, listener, options) {
  if (!target || typeof target.addEventListener !== 'function') return () => {};
  let active = true;
  const cleanup = () => {
    if (!active) return;
    active = false;
    target.removeEventListener('transitionend', listener, options);
  };
  target.addEventListener('transitionend', listener, options);
  return cleanup;
}

export { isTransitionEndSupported };
