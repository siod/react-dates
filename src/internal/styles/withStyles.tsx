import React from 'react';
import type {
  ComponentType,
  CSSProperties,
  ForwardRefExoticComponent,
  ForwardedRef,
  PropsWithoutRef,
  RefAttributes,
} from 'react';
import PropTypes from 'prop-types';

import defaultStyleTokens from './defaultStyleTokens.js';
import mergeInlineStyles from './inlineStyles.js';

const EMPTY = {};

export type StyleObject = Record<string, unknown>;
export type StyleMap = Record<string, StyleObject>;
export type CssArgument = string | StyleObject | CssArgument[] | false | null | undefined;
export type CssResult = { className?: string; style?: CSSProperties };
export type CssFunction = (...arguments_: CssArgument[]) => CssResult;

export interface WithStylesProps {
  styles: StyleMap;
  theme: typeof defaultStyleTokens;
  css: CssFunction;
}

export interface WithStylesOptions<
  StylesPropName extends string = 'styles',
  ThemePropName extends string = 'theme',
  CssPropName extends string = 'css',
> {
  stylesPropName?: StylesPropName;
  themePropName?: ThemePropName;
  cssPropName?: CssPropName;
  pureComponent?: boolean;
}

type InjectedStyleProps<
  StylesPropName extends string,
  ThemePropName extends string,
  CssPropName extends string,
> = Record<StylesPropName, StyleMap>
  & Record<ThemePropName, typeof defaultStyleTokens>
  & Record<CssPropName, CssFunction>;

type StyleComponent<Props> = ComponentType<Props> & {
  defaultProps?: Partial<Props>;
  propTypes?: Record<string, unknown>;
  prototype?: React.Component;
};

export type StyledComponent<Props, InjectedProps, Wrapped extends ComponentType<InjectedProps>> =
  ForwardRefExoticComponent<PropsWithoutRef<Props> & RefAttributes<unknown>> & {
    WrappedComponent: Wrapped;
    defaultProps?: Partial<Props>;
    propTypes?: Record<string, unknown>;
  };

function isStyleObject(value: unknown): value is StyleObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function withStyles<
  StylesPropName extends string = 'styles',
  ThemePropName extends string = 'theme',
  CssPropName extends string = 'css',
>(
  stylesFn: (theme: typeof defaultStyleTokens) => StyleMap = () => EMPTY,
  options: WithStylesOptions<StylesPropName, ThemePropName, CssPropName> = {},
) {
  const {
    stylesPropName = 'styles' as StylesPropName,
    themePropName = 'theme' as ThemePropName,
    cssPropName = 'css' as CssPropName,
  } = options;

  return function withStylesHOC<
    Props extends InjectedStyleProps<StylesPropName, ThemePropName, CssPropName>,
  >(WrappedComponent: StyleComponent<Props>) {
    type PublicProps = Omit<Props, keyof InjectedStyleProps<StylesPropName, ThemePropName, CssPropName>>;

    const wrappedDefaultProps = WrappedComponent.defaultProps || EMPTY;
    if (!(WrappedComponent.prototype instanceof React.Component)) {
      delete WrappedComponent.defaultProps;
    }

    function StyledComponent(props: PropsWithoutRef<PublicProps>, ref: ForwardedRef<unknown>) {
      const normalizedProps: Record<string, unknown> = { ...props };
      Object.entries(wrappedDefaultProps).forEach(([key, value]) => {
        if (normalizedProps[key] === undefined) normalizedProps[key] = value;
      });
      const theme = normalizedProps[themePropName] || defaultStyleTokens;
      const typedTheme = theme as typeof defaultStyleTokens;
      const rawStyles = stylesFn(typedTheme) || EMPTY;
      const styleLookup = new WeakMap<StyleObject, string>();
      const styles = Object.entries(rawStyles).reduce<StyleMap>((result, [key, value]) => {
        if (isStyleObject(value)) styleLookup.set(value, key);
        result[key] = value;
        return result;
      }, {});

      const css: CssFunction = (...arguments_) => {
        const classNames: string[] = [];
        const inline: StyleObject[] = [];
        arguments_.forEach((argument) => {
          if (!argument) return;
          if (Array.isArray(argument)) {
            const nested = css(...argument);
            if (nested.className) classNames.push(nested.className);
            if (nested.style) inline.push(nested.style as StyleObject);
            return;
          }
          if (typeof argument === 'string') {
            classNames.push(argument);
            return;
          }
          if (!isStyleObject(argument)) return;
          const className = styleLookup.get(argument);
          if (className) {
            classNames.push(className);
            return;
          }
          if (typeof argument.className === 'string') classNames.push(argument.className);
          if (isStyleObject(argument.style)) inline.push(argument.style);
          const style = { ...argument };
          delete style.className;
          delete style.style;
          if (Object.keys(style).length) inline.push(style);
        });

        const result: CssResult = {};
        if (classNames.length) result.className = classNames.join(' ');
        const style = mergeInlineStyles(...inline) as CSSProperties;
        if (Object.keys(style).length) result.style = style;
        return result;
      };

      const injected = {
        ...normalizedProps,
        [stylesPropName]: styles,
        [themePropName]: typedTheme,
        [cssPropName]: css,
      } as Props;
      if (ref) Object.assign(injected, { ref });
      const RenderComponent = WrappedComponent as ComponentType<Props>;
      return React.createElement(RenderComponent, injected);
    }

    const Forwarded = React.forwardRef<unknown, PublicProps>(StyledComponent) as StyledComponent<PublicProps, Props, StyleComponent<Props>>;
    Forwarded.displayName = `withStyles(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    Forwarded.WrappedComponent = WrappedComponent;
    const forwardedPropTypes: Record<string, unknown> = {
      ...(WrappedComponent.propTypes as unknown as Record<string, unknown> | undefined),
    };
    delete forwardedPropTypes[stylesPropName];
    delete forwardedPropTypes[themePropName];
    delete forwardedPropTypes[cssPropName];
    Forwarded.propTypes = forwardedPropTypes;
    Forwarded.defaultProps = wrappedDefaultProps;
    return Forwarded;
  };
}

export const withStylesPropTypes: Record<'styles' | 'theme' | 'css', unknown> = {
  styles: PropTypes.object,
  theme: PropTypes.object,
  css: PropTypes.func,
};

export const withStylesFunctional = withStyles;
export default withStyles;
