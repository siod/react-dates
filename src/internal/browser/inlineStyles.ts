export type InlineStyle = Record<string, unknown>;
export type InlineStyleInput = InlineStyle | false | null | undefined;

export default function mergeInlineStyles(...styles: InlineStyleInput[]) {
  return styles.reduce<InlineStyle>((merged, style) => {
    if (!style || typeof style !== 'object') return merged;
    return { ...merged, ...style };
  }, {});
}

export const mergeStyles = mergeInlineStyles;
