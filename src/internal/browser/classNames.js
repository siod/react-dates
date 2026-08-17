/** Merge class names deterministically, ignoring falsey values and arrays. */
export default function classNames(...values) {
  const result = [];
  const append = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(append);
      return;
    }
    if (typeof value === 'string' || typeof value === 'number') result.push(String(value));
  };
  values.forEach(append);
  return result.join(' ');
}

export const mergeClassNames = classNames;
export const cx = classNames;

export function bem(block, element, modifiers) {
  const prefix = element ? `${block}__${element}` : block;
  if (!modifiers) return prefix;
  const entries = typeof modifiers === 'string' ? [modifiers] : Object.keys(modifiers).filter((key) => modifiers[key]);
  return classNames(prefix, entries.map((modifier) => `${prefix}--${modifier}`));
}

export function rtlClassName(name, rtl = false) {
  return classNames(name, rtl && `${name}--rtl`);
}

export { classNames };
