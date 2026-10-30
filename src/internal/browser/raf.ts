export type AnimationFrameHandle = number;
export type AnimationFrameCancel = (() => void) & { id: AnimationFrameHandle };

const getWindow = () => (typeof window !== 'undefined' ? window : null);

export function requestAnimationFrameSafe(callback: FrameRequestCallback): AnimationFrameHandle {
  const target = getWindow();
  if (target?.requestAnimationFrame) return target.requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16);
}

export function cancelAnimationFrameSafe(id: AnimationFrameHandle) {
  const target = getWindow();
  if (target?.cancelAnimationFrame && typeof id === 'number') target.cancelAnimationFrame(id);
  else clearTimeout(id);
}

export default function scheduleAnimationFrame(callback: FrameRequestCallback): AnimationFrameCancel {
  let active = true;
  const id = requestAnimationFrameSafe((time) => {
    if (active) callback(time);
  });
  const cancel = (() => {
    if (!active) return;
    active = false;
    cancelAnimationFrameSafe(id);
  }) as AnimationFrameCancel;
  cancel.id = id;
  return cancel;
}
