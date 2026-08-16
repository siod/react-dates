/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: [
    '../stories/**/*.stories.@(js|jsx|mjs|cjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-a11y'],
  // The legacy root Babel file references removed Storybook-era plugins. CSF
  // stories do not need docgen to build, and turning it off keeps Storybook's
  // Vite pipeline independent of that compatibility configuration.
  typescript: {
    reactDocgen: false,
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
