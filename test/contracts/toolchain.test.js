import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const datepickerCss = readFileSync(
  resolve(process.cwd(), 'src/styles/datepicker.css'),
  'utf8',
);
const variablesCss = readFileSync(
  resolve(process.cwd(), 'src/internal/styles/variables.css'),
  'utf8',
);

describe('modern test toolchain', () => {
  it('runs in a DOM environment', () => {
    const element = document.createElement('div');
    element.dataset.ready = 'true';

    expect(element.dataset.ready).toBe('true');
  });

  it('keeps source CSS valid without Sass-only color functions', () => {
    expect(datepickerCss).not.toContain('darken(');
    expect(datepickerCss).toContain('var(--react-dates-gray-lighter-dark)');
    expect(variablesCss).toContain('--react-dates-gray-lighter-dark: #b0b3b4;');
  });
});
