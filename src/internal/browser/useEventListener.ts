import { useEffect, useRef } from 'react';

import { subscribe, type EventCallback } from './subscribe.js';

export default function useEventListener<EventType extends Event = Event>(
  target: EventTarget | null | undefined,
  type: string | null | undefined,
  listener: EventCallback<EventType> | null | undefined,
  options?: boolean | AddEventListenerOptions,
) {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!target || !type) return undefined;
    const dispatch = (event: EventType) => listenerRef.current?.(event);
    return subscribe(target, type, dispatch, options);
  }, [target, type, options]);
}
