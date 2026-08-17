export default function mergeInlineStyles(...styles) {
  return styles.reduce((result, style) => (
    style && typeof style === 'object' ? { ...result, ...style } : result
  ), {});
}

export const mergeStyles = mergeInlineStyles;
