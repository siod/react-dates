import { createElement, StrictMode } from 'react';
import { render, renderHook } from '@testing-library/react';

function strictWrapper(UserWrapper) {
  return function StrictTestWrapper({ children }) {
    const content = UserWrapper
      ? createElement(UserWrapper, null, children)
      : children;

    return createElement(StrictMode, null, content);
  };
}

/**
 * Render a component through React's development StrictMode checks.
 *
 * A caller-supplied Testing Library wrapper is kept inside StrictMode so
 * providers are exercised by the same mount/unmount cycle as the component.
 */
export function renderStrict(ui, options = {}) {
  const { wrapper: UserWrapper, ...renderOptions } = options;

  return render(ui, {
    ...renderOptions,
    wrapper: strictWrapper(UserWrapper),
  });
}

/** Render a hook through the same StrictMode boundary as renderStrict. */
export function renderHookStrict(callback, options = {}) {
  const { wrapper: UserWrapper, ...renderOptions } = options;

  return renderHook(callback, {
    ...renderOptions,
    wrapper: strictWrapper(UserWrapper),
  });
}

export { strictWrapper };
