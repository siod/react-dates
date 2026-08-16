import { useEffect, useRef } from 'react';

import subscribe from './subscribe';

/** Subscribe to an event while keeping the latest callback without churn. */
export default function useEventListener(target, type, listener, options) {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!target || !type) return undefined;
    const dispatch = (event) => listenerRef.current?.(event);
    return subscribe(target, type, dispatch, options);
  }, [target, type, options]);
}
