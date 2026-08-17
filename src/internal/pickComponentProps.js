const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/** Keep only props declared by a component's public runtime contract. */
export default function pickComponentProps(Component, props) {
  const propTypes = Component?.propTypes || Component?.WrappedComponent?.propTypes || {};
  return Object.keys(props || {}).reduce((result, key) => {
    if (hasOwn(propTypes, key)) result[key] = props[key];
    return result;
  }, {});
}
