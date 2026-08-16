const NOFLIP = '/* @noflip */';

/** Preserve values that must not be transformed by an RTL stylesheet pass. */
export default function noflip(value) {
  if (typeof value === 'number') return `${value}px ${NOFLIP}`;
  if (typeof value === 'string') return `${value} ${NOFLIP}`;
  throw new TypeError('noflip expects a string or a number');
}

export { NOFLIP };
