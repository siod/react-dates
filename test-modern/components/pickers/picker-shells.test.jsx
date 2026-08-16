import React from 'react';
import { DateTime } from 'luxon';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderStrict } from '../../helpers/index.js';
import SingleDatePicker from '../../../src/components/SingleDatePicker.jsx';

afterEach(cleanup);

describe('picker shells', () => {
  it('opens a StrictMode-safe single picker in a lazily-created portal', () => {
    const onFocusChange = vi.fn();
    const onDateChange = vi.fn();
    const { unmount } = renderStrict(
      <SingleDatePicker
        date={null}
        focused
        onDateChange={onDateChange}
        onFocusChange={onFocusChange}
        withPortal
        disableScroll
        numberOfMonths={1}
        initialVisibleMonth={() => DateTime.fromISO('2099-02-01')}
        isOutsideRange={() => false}
      />,
    );

    expect(document.body.querySelector('[class*="SingleDatePicker_picker"]')).toBeTruthy();
    const scrollRoot = document.scrollingElement || document.documentElement;
    expect(scrollRoot.style.overflow).toBe('hidden');
    unmount();
    expect(scrollRoot.style.overflow).toBe('');
  });

});
