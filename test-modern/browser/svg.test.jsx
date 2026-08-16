import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ArrowLeft from '../../src/svg/arrow-left.jsx';
import Calendar from '../../src/svg/calendar.jsx';
import Close from '../../src/svg/close.jsx';

describe('SVG components', () => {
  it('preserves paths, props and decorative accessibility defaults', () => {
    const { container } = render(<><ArrowLeft className="icon" /><Calendar title="Calendar" /><Close /></>);
    expect(container.querySelectorAll('svg')).toHaveLength(3);
    expect(container.querySelector('.icon').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('svg[role="img"] title').textContent).toBe('Calendar');
    expect(container.querySelectorAll('path')).toHaveLength(3);
  });
});
