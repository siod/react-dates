import React, { useEffect, useRef } from 'react';

import subscribe from './subscribe';

export function useOutsideClick(ref, onOutsideClick, {
  disabled = false,
  useCapture = true,
  event = 'mousedown',
} = {}) {
  const callbackRef = useRef(onOutsideClick);
  callbackRef.current = onOutsideClick;

  useEffect(() => {
    if (disabled || typeof document === 'undefined') return undefined;
    const onEvent = (nativeEvent) => {
      const root = ref?.current;
      const target = nativeEvent.target;
      if (root && target && !root.contains(target)) callbackRef.current?.(nativeEvent);
    };
    return subscribe(document, event, onEvent, { capture: useCapture });
  }, [disabled, event, ref, useCapture]);
}

export function OutsideClickHandler({
  children,
  onOutsideClick,
  disabled = false,
  useCapture = true,
  display = 'block',
}) {
  const ref = useRef(null);
  useOutsideClick(ref, onOutsideClick, { disabled, useCapture });
  const style = display !== 'block' ? { display } : undefined;
  return <div ref={ref} style={style}>{children}</div>;
}

export default OutsideClickHandler;
