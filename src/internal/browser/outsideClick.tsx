import { useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode, RefObject } from 'react';

import { subscribe } from './subscribe.js';

export interface OutsideClickOptions {
  disabled?: boolean;
  useCapture?: boolean;
  event?: string;
}

export interface OutsideClickHandlerProps {
  children?: ReactNode;
  onOutsideClick?: (event: Event) => void;
  disabled?: boolean;
  useCapture?: boolean;
  display?: CSSProperties['display'];
}

export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutsideClick?: (event: Event) => void,
  {
    disabled = false,
    useCapture = true,
    event = 'mousedown',
  }: OutsideClickOptions = {},
) {
  const callbackRef = useRef(onOutsideClick);
  callbackRef.current = onOutsideClick;

  useEffect(() => {
    if (disabled || typeof document === 'undefined') return undefined;
    const onEvent = (nativeEvent: Event) => {
      const root = ref.current;
      const target = nativeEvent.target;
      if (root && target instanceof Node && !root.contains(target)) {
        callbackRef.current?.(nativeEvent);
      }
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
}: OutsideClickHandlerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onOutsideClick, { disabled, useCapture });
  const style = display !== 'block' ? { display } : undefined;
  return <div ref={ref} style={style}>{children}</div>;
}

export default OutsideClickHandler;
