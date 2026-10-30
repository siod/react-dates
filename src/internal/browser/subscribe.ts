export type EventCallback<EventType extends Event = Event> = (event: EventType) => void;

export function subscribe<EventType extends Event = Event>(
  target: EventTarget | null | undefined,
  type: string,
  listener: EventCallback<EventType> | null | undefined,
  options?: boolean | AddEventListenerOptions,
) {
  if (!target || typeof target.addEventListener !== 'function' || typeof listener !== 'function') {
    return () => {};
  }

  const eventListener: EventListener = (event) => listener(event as EventType);
  target.addEventListener(type, eventListener, options);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    target.removeEventListener(type, eventListener, options);
  };
}

export const addEventListener = subscribe;
export default subscribe;
