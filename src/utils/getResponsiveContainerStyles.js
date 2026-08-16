import { ANCHOR_LEFT } from '../constants';

export default function getResponsiveContainerStyles(
  anchorDirection,
  currentOffset,
  containerRect,
  margin,
) {
  const calculatedMargin = margin || 0;
  const viewportWidth = typeof document !== 'undefined'
    ? document.documentElement.clientWidth
    : (typeof window !== 'undefined' ? window.innerWidth : 0);
  const availableWidth = Math.max(viewportWidth - (calculatedMargin * 2), 0);
  const constrainedWidth = Math.min(containerRect.width, availableWidth);

  let calculatedOffset;
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

  const styles = { [anchorDirection]: calculatedOffset };
  if (containerRect.width > availableWidth) {
    styles.maxWidth = availableWidth;
    styles.overflowX = 'auto';
  }

  return styles;
}
