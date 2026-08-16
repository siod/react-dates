/** Merge style objects without mutating callers; null/false values are ignored. */
export default function mergeInlineStyles(...styles) {
  return styles.reduce((merged, style) => {
    if (!style || typeof style !== 'object') return merged;
    return { ...merged, ...style };
  }, {});
}

export const mergeStyles = mergeInlineStyles;
