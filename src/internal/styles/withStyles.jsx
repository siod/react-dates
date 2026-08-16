import React from 'react';
import PropTypes from 'prop-types';

import DefaultTheme from '../../theme/DefaultTheme';
import mergeInlineStyles from './inlineStyles';

const EMPTY = {};

function isStyleObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Resolve react-with-styles factories to the class names shipped in the
 * legacy static stylesheet. No style tag or CSS rule is created at runtime.
 */
export function withStyles(stylesFn = () => EMPTY, options = {}) {
  const {
    stylesPropName = 'styles',
    themePropName = 'theme',
    cssPropName = 'css',
    pureComponent = false,
  } = options;
  const Base = pureComponent ? React.PureComponent : React.Component;

  return function withStylesHOC(WrappedComponent) {
    function StyledComponent(props, ref) {
      const theme = props[themePropName] || DefaultTheme;
      const rawStyles = stylesFn(theme) || EMPTY;
      const styleKeys = Object.keys(rawStyles);
      const styleLookup = new WeakMap();
      const styles = styleKeys.reduce((result, key) => {
        const value = rawStyles[key];
        const className = key;
        if (isStyleObject(value)) styleLookup.set(value, className);
        result[key] = value;
        return result;
      }, {});

      const css = (...args) => {
        const classNames = [];
        const inline = [];
        args.forEach((argument) => {
          if (!argument) return;
          if (Array.isArray(argument)) {
            const nested = css(...argument);
            if (nested.className) classNames.push(nested.className);
            if (nested.style) inline.push(nested.style);
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
          if (argument.className) classNames.push(argument.className);
          if (argument.style) inline.push(argument.style);
          const { className: ignoredClassName, style: ignoredStyle, ...style } = argument;
          if (Object.keys(style).length) inline.push(style);
        });

        const result = {};
        if (classNames.length) result.className = classNames.join(' ');
        const style = mergeInlineStyles(...inline);
        if (Object.keys(style).length) result.style = style;
        return result;
      };

      const injected = {
        ...props,
        [stylesPropName]: styles,
        [themePropName]: theme,
        [cssPropName]: css,
      };
      if (ref) injected.ref = ref;
      return <WrappedComponent {...injected} />;
    }

    const Forwarded = React.forwardRef(StyledComponent);
    Forwarded.displayName = `withStyles(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
    Forwarded.WrappedComponent = WrappedComponent;
    Forwarded.propTypes = { ...WrappedComponent.propTypes };
    // Keep the legacy contract where injected style props are not required
    // from callers, even though wrapped components may declare them required.
    delete Forwarded.propTypes[stylesPropName];
    delete Forwarded.propTypes[themePropName];
    delete Forwarded.propTypes[cssPropName];
    return Forwarded;
  };
}

export const withStylesPropTypes = {
  styles: PropTypes.object,
  theme: PropTypes.object,
  css: PropTypes.func,
};

export const withStylesFunctional = withStyles;
export default withStyles;
