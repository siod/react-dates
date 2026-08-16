// @vitest-environment node

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import * as publicApi from '../../src/index.js';
import SingleDatePicker from '../../src/components/SingleDatePicker.jsx';

describe('server rendering', () => {
  it('imports the public surface without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(publicApi.SingleDatePicker).toBeTruthy();
    expect(publicApi.DateRangePicker).toBeTruthy();
  });

  it('renders a picker shell without accessing the DOM', () => {
    expect(() => renderToString(
      <SingleDatePicker
        id="ssr-date"
        date={null}
        focused={false}
        onDateChange={() => {}}
        onFocusChange={() => {}}
      />,
    )).not.toThrow();
  });
});
