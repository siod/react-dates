import { createElement, StrictMode } from 'react';

/** Storybook 10 preview configuration. */
const preview = {
  parameters: {
    a11y: {
      // Keep checks enabled in local Storybook and in the CI build.
      test: 'error',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Introduction', 'Pickers', '*'],
      },
    },
  },
  decorators: [
    (Story) => createElement(StrictMode, null, createElement(Story)),
  ],
};

export default preview;
