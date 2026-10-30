export default function calculateDimension(
  element: HTMLElement | null,
  axis: 'height' | 'width',
  borderBox = false,
  withMargin = false,
) {
  if (!element) {
    return 0;
  }

  const axisStart = axis === 'width' ? 'Left' : 'Top';
  const axisEnd = axis === 'width' ? 'Right' : 'Bottom';

  // Only read styles if we need to
  const style = (!borderBox || withMargin) ? window.getComputedStyle(element) : null;

  // Offset includes border and padding
  const { offsetWidth, offsetHeight } = element;
  let size = axis === 'width' ? offsetWidth : offsetHeight;

  // Get the inner size
  if (!borderBox) {
    if (style) size -= (
      parseFloat(style[`padding${axisStart}`])
      + parseFloat(style[`padding${axisEnd}`])
      + parseFloat(style[`border${axisStart}Width`])
      + parseFloat(style[`border${axisEnd}Width`])
    );
  }

  // Apply margin
  if (withMargin) {
    if (style) {
      size += (parseFloat(style[`margin${axisStart}`]) + parseFloat(style[`margin${axisEnd}`]));
    }
  }

  return size;
}
