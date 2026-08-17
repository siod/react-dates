const getWindow = () => (typeof window !== 'undefined' ? window : null);

export function requestAnimationFrameSafe(callback) {
  const target = getWindow();
  if (target?.requestAnimationFrame) return target.requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16);
}

export function cancelAnimationFrameSafe(id) {
  const target = getWindow();
  if (target?.cancelAnimationFrame) target.cancelAnimationFrame(id);
  else clearTimeout(id);
}

/** Schedule a callback and return a cancellation function. */
export default function scheduleAnimationFrame(callback) {
  let active = true;
  const id = requestAnimationFrameSafe((time) => {
    if (active) callback(time);
  });
  const cancel = () => {
    if (!active) return;
    active = false;
    cancelAnimationFrameSafe(id);
  };
  cancel.id = id;
  return cancel;
}
