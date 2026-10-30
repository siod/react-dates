import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  getDirectionClassName,
  getNoFlipClassName,
} from '../../../src/internal/styles/rtl.js';
import noflip from '../../../src/internal/styles/noflip.js';
import { withStyles } from '../../../src/internal/styles/withStyles.jsx';

describe('RTL and no-flip styling contracts', () => {
  it('adds direction-aware class names only when requested', () => {
    expect(getDirectionClassName('CalendarDay', true)).toBe('CalendarDay CalendarDay__rtl');
    expect(getDirectionClassName('CalendarDay', false)).toBe('CalendarDay');
    expect(getNoFlipClassName('CalendarDay', true)).toBe('CalendarDay CalendarDay__noflip');
    expect(getNoFlipClassName('CalendarDay', false)).toBe('CalendarDay');
  });

  it('marks string and numeric values as no-flip and rejects unsupported values', () => {
    expect(noflip('left: 0')).toBe('left: 0 /* @noflip */');
    expect(noflip(12)).toBe('12px /* @noflip */');
    expect(() => noflip({})).toThrow(TypeError);
  });
});

describe('withStyles observable edge cases', () => {
  it('injects static class names, merges inline styles, and forwards ordinary props', () => {
    function Button({ css, styles, title }) {
      return (
        <button type="button" title={title} {...css(
          styles.Button,
          'extra-class',
          { color: 'red', style: { padding: 4 } },
          [styles.Button, { margin: 2 }],
        )}>
          button
        </button>
      );
    }
    const Styled = withStyles(() => ({ Button: { color: 'blue' } }))(Button);
    render(<Styled title="passed-through" />);
    const button = screen.getByRole('button', { name: 'button' });

    expect(button.title).toBe('passed-through');
    expect(button.className).toBe('Button extra-class Button');
    expect(button.style.color).toBe('red');
    expect(button.style.padding).toBe('4px');
    expect(button.style.margin).toBe('2px');
  });

  it('supports custom prop names, custom themes, and absent style factories', () => {
    function Label({ design, palette, applyCss }) {
      return <span {...applyCss(design.Label)}>{palette.name}</span>;
    }
    const Styled = withStyles(
      (theme) => ({ Label: { color: theme.name } }),
      { stylesPropName: 'design', themePropName: 'palette', cssPropName: 'applyCss' },
    )(Label);
    const { rerender } = render(<Styled palette={{ name: 'custom' }} />);
    expect(screen.getByText('custom').className).toBe('Label');

    function Plain({ css }) {
      return <span {...css({ color: 'green' })}>plain</span>;
    }
    const NoStyles = withStyles(() => null)(Plain);
    rerender(<NoStyles />);
    expect(screen.getByText('plain').style.color).toBe('green');
  });

  it('normalizes wrapped defaults', () => {
    class Defaulted extends React.Component {
      static defaultProps = { label: 'default label' };

      render() {
        const { css, label, styles } = this.props;
        return <span {...css(styles.Label)}>{label}</span>;
      }
    }
    const Styled = withStyles(() => ({ Label: {} }))(Defaulted);
    render(<Styled />);
    expect(screen.getByText('default label').className).toBe('Label');
  });
});
