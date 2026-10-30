export default function getTransformStyles(transformValue: string) {
  return {
    transform: transformValue,
    msTransform: transformValue,
    MozTransform: transformValue,
    WebkitTransform: transformValue,
  };
}
