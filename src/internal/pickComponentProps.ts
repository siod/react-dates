type RuntimePropTypes = Record<string, unknown>;

export interface RuntimePropTypesComponent {
  defaultProps?: Record<string, unknown>;
  propTypes?: RuntimePropTypes;
  WrappedComponent?: RuntimePropTypesComponent;
}

const hasOwn = (object: object, key: PropertyKey) => (
  Object.prototype.hasOwnProperty.call(object, key)
);

export default function pickComponentProps<Props extends object>(
  Component: RuntimePropTypesComponent | null | undefined,
  props: Props | null | undefined,
): Partial<Props> {
  const propTypes = Component?.propTypes || Component?.WrappedComponent?.propTypes || {};
  const defaultProps = Component?.defaultProps || Component?.WrappedComponent?.defaultProps || {};
  const allowedProps = Object.keys(propTypes).length ? propTypes : defaultProps;
  return (Object.keys(props || {}) as Array<keyof Props>).reduce<Partial<Props>>((result, key) => {
    if (hasOwn(allowedProps, key)) result[key] = props?.[key];
    return result;
  }, {});
}
