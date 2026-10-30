export type StyleRecord = Record<string, unknown>;
export type StyleInput = StyleRecord | false | null | undefined;

export default function mergeInlineStyles(...styles: StyleInput[]) {
  return styles.reduce<StyleRecord>((result, style) => (
    style && typeof style === 'object' ? { ...result, ...style } : result
  ), {});
}

export const mergeStyles = mergeInlineStyles;
