export default function getActiveElement(root) {
  if (typeof document === 'undefined') return null;
  const active = root?.activeElement || document.activeElement;
  return active || null;
}

export { getActiveElement };
