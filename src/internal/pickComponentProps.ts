export interface ComponentWithDefaults {
  defaultProps?: Record<string, unknown>;
  WrappedComponent?: ComponentWithDefaults;
}

const hasOwn = (object: object, key: PropertyKey) => (
  Object.prototype.hasOwnProperty.call(object, key)
);

export default function pickComponentProps<Props extends object>(
  Component: ComponentWithDefaults | null | undefined,
  props: Props | null | undefined,
): Partial<Props> {
  const defaultProps = Component?.defaultProps || Component?.WrappedComponent?.defaultProps || {};
  return (Object.keys(props || {}) as Array<keyof Props>).reduce<Partial<Props>>((result, key) => {
    if (hasOwn(defaultProps, key)) result[key] = props?.[key];
    return result;
  }, {});
}
