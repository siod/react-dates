import type { CSSProperties } from 'react';
import type { AnchorDirection } from '../types.js';
import { ANCHOR_LEFT } from '../constants.js';

export default function getResponsiveContainerStyles(
  anchorDirection: AnchorDirection,
  currentOffset: number,
  containerRect: Pick<DOMRect, 'left' | 'right' | 'width'>,
  margin?: number,
): CSSProperties {
  const calculatedMargin = margin || 0;
  const viewportWidth = typeof document !== 'undefined'
    ? document.documentElement.clientWidth
    : (typeof window !== 'undefined' ? window.innerWidth : 0);
  const availableWidth = Math.max(viewportWidth - (calculatedMargin * 2), 0);
  const constrainedWidth = Math.min(containerRect.width, availableWidth);

  let calculatedOffset: number;
  if (anchorDirection === ANCHOR_LEFT) {
    const unshiftedLeft = containerRect.left - currentOffset;
    const desiredLeft = Math.max(
      calculatedMargin,
      Math.min(unshiftedLeft, viewportWidth - calculatedMargin - constrainedWidth),
    );
    calculatedOffset = desiredLeft - unshiftedLeft;
  } else {
    const unshiftedRight = containerRect.right + currentOffset;
    const desiredRight = Math.min(
      viewportWidth - calculatedMargin,
      Math.max(unshiftedRight, calculatedMargin + constrainedWidth),
    );
    calculatedOffset = unshiftedRight - desiredRight;
  }

  const styles: CSSProperties = { [anchorDirection]: calculatedOffset };
  if (containerRect.width > availableWidth) {
    styles.maxWidth = availableWidth;
    styles.overflowX = 'auto';
  }

  return styles;
}
