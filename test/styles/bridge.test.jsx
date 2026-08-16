import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mergeInlineStyles, withStyles } from '../../src/internal/styles';

describe('static styles bridge', () => {
  it('maps style keys to legacy classes and lets inline values win', () => {
    function Button({ css, styles }) {
      return <button {...css(styles.Button, { color: 'red', style: { padding: 4 } })}>button</button>;
    }
    const Styled = withStyles(() => ({ Button: { color: 'blue' } }))(Button);
    const { getByText } = render(<Styled />);
    expect(getByText('button').className).toBe('Button');
    expect(getByText('button').style.color).toBe('red');
    expect(getByText('button').style.padding).toBe('4px');
    expect(mergeInlineStyles({ color: 'blue' }, null, { color: 'red' })).toEqual({ color: 'red' });
  });
});
