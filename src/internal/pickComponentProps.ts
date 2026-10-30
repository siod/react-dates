type RuntimePropTypes = Record<string, unknown>;

export interface RuntimePropTypesComponent {
  propTypes?: RuntimePropTypes;
  WrappedComponent?: RuntimePropTypesComponent;
}

const hasOwn = (object: object, key: PropertyKey) => (
  Object.prototype.hasOwnProperty.call(object, key)
);

export default function pickComponentProps<Props extends Record<string, unknown>>(
  Component: RuntimePropTypesComponent | null | undefined,
  props: Props | null | undefined,
): Partial<Props> {
  const propTypes = Component?.propTypes || Component?.WrappedComponent?.propTypes || {};
  return (Object.keys(props || {}) as Array<keyof Props>).reduce<Partial<Props>>((result, key) => {
    if (hasOwn(propTypes, key)) result[key] = props?.[key];
    return result;
  }, {});
}
