export interface ActiveElementRoot {
  activeElement: Element | null;
}

export default function getActiveElement(root?: ActiveElementRoot | null) {
  if (typeof document === 'undefined') return null;
  const active = root?.activeElement || document.activeElement;
  return active || null;
}

export { getActiveElement };
