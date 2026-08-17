import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DayPickerNavigation from '../../../src/components/DayPickerNavigation.jsx';
import {
  HORIZONTAL_ORIENTATION,
  VERTICAL_ORIENTATION,
  VERTICAL_SCROLLABLE,
} from '../../../src/constants.js';
import { DayPickerNavigationPhrases } from '../../../src/defaultPhrases.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const previousLabel = DayPickerNavigationPhrases.jumpToPrevMonth;
const nextLabel = DayPickerNavigationPhrases.jumpToNextMonth;

describe('DayPickerNavigation observable behavior', () => {
  it('renders accessible previous and next controls by default', () => {
    render(<DayPickerNavigation />);

    const previous = screen.getByRole('button', { name: previousLabel });
    const next = screen.getByRole('button', { name: nextLabel });

    expect(previous.getAttribute('tabindex')).toBe('0');
    expect(next.getAttribute('tabindex')).toBe('0');
    expect(previous.getAttribute('aria-label')).toBe(previousLabel);
    expect(next.getAttribute('aria-label')).toBe(nextLabel);
  });

  it('supports independently hidden navigation controls and no controls', () => {
    const { rerender } = render(<DayPickerNavigation showNavNextButton={false} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: previousLabel })).toBeTruthy();

    rerender(<DayPickerNavigation showNavPrevButton={false} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: nextLabel })).toBeTruthy();

    rerender(<DayPickerNavigation showNavPrevButton={false} showNavNextButton={false} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('marks disabled controls and does not invoke their callbacks', () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    render(
      <DayPickerNavigation
        disableNext
        disablePrev
        onNextMonthClick={onNextMonthClick}
        onPrevMonthClick={onPrevMonthClick}
      />,
    );

    const previous = screen.getByRole('button', { name: previousLabel });
    const next = screen.getByRole('button', { name: nextLabel });
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(next.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(previous);
    fireEvent.click(next);
    fireEvent.keyUp(previous, { key: 'Enter' });
    fireEvent.keyUp(next, { key: ' ' });
    expect(onPrevMonthClick).not.toHaveBeenCalled();
    expect(onNextMonthClick).not.toHaveBeenCalled();
  });

  it('invokes callbacks for clicks and Enter/Space keyboard activation', () => {
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    render(
      <DayPickerNavigation
        onNextMonthClick={onNextMonthClick}
        onPrevMonthClick={onPrevMonthClick}
      />,
    );

    const previous = screen.getByRole('button', { name: previousLabel });
    const next = screen.getByRole('button', { name: nextLabel });
    fireEvent.click(previous);
    fireEvent.keyUp(previous, { key: 'Enter' });
    fireEvent.keyUp(previous, { key: ' ' });
    fireEvent.keyUp(previous, { key: 'k' });
    fireEvent.click(next);
    fireEvent.keyUp(next, { key: 'Enter' });
    fireEvent.keyUp(next, { key: ' ' });
    fireEvent.keyUp(next, { key: 'k' });

    expect(onPrevMonthClick).toHaveBeenCalledTimes(3);
    expect(onNextMonthClick).toHaveBeenCalledTimes(3);
  });

  it('uses direction-aware icons and orientation-aware navigation', () => {
    const { container, rerender } = render(<DayPickerNavigation isRTL />);
    const previousPath = screen.getByRole('button', { name: previousLabel }).querySelector('path');
    const nextPath = screen.getByRole('button', { name: nextLabel }).querySelector('path');
    expect(previousPath.getAttribute('d')).toContain('M694');
    expect(nextPath.getAttribute('d')).toContain('M336');

    rerender(<DayPickerNavigation orientation={VERTICAL_ORIENTATION} />);
    expect(container.querySelector('svg path').getAttribute('d')).toContain('M32');
    expect(container.firstElementChild.className).toContain('DayPickerNavigation__verticalDefault');

    rerender(<DayPickerNavigation orientation={VERTICAL_SCROLLABLE} />);
    expect(container.firstElementChild.className).toContain('DayPickerNavigation__verticalScrollableDefault');
  });

  it('exposes custom navigation render props without adding default controls', () => {
    const renderNavPrevButton = vi.fn((props) => (
      <button
        aria-label={props.ariaLabel}
        disabled={props.disabled}
        onClick={props.onClick}
        onKeyUp={props.onKeyUp}
        type="button"
      >
        Previous
      </button>
    ));
    const renderNavNextButton = vi.fn((props) => (
      <button
        aria-label={props.ariaLabel}
        disabled={props.disabled}
        onClick={props.onClick}
        onKeyUp={props.onKeyUp}
        type="button"
      >
        Next
      </button>
    ));
    const onPrevMonthClick = vi.fn();
    const onNextMonthClick = vi.fn();
    render(
      <DayPickerNavigation
        disableNext
        disablePrev
        onNextMonthClick={onNextMonthClick}
        onPrevMonthClick={onPrevMonthClick}
        renderNavNextButton={renderNavNextButton}
        renderNavPrevButton={renderNavPrevButton}
      />,
    );

    expect(renderNavPrevButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: previousLabel,
      disabled: true,
      onClick: undefined,
    }));
    expect(renderNavNextButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: nextLabel,
      disabled: true,
      onClick: undefined,
    }));
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: previousLabel }));
    fireEvent.click(screen.getByRole('button', { name: nextLabel }));
    expect(onPrevMonthClick).not.toHaveBeenCalled();
    expect(onNextMonthClick).not.toHaveBeenCalled();
  });

  it('preserves custom button tab order and vertical default styling rules', () => {
    const customPrevious = <button type="button">Custom previous</button>;
    const customNext = <button type="button">Custom next</button>;
    const { container, rerender } = render(
      <DayPickerNavigation navNext={customNext} navPrev={customPrevious} />,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper.querySelector('[role="button"]')).toBeTruthy();
    expect(wrapper.querySelector('[role="button"]').getAttribute('tabindex')).toBeNull();
    expect(wrapper.querySelector('button')).toBeTruthy();

    rerender(
      <DayPickerNavigation
        orientation={VERTICAL_ORIENTATION}
        renderNavPrevButton={() => <button type="button">Custom previous</button>}
        renderNavNextButton={() => <button type="button">Custom next</button>}
      />,
    );
    expect(container.firstElementChild.className).not.toContain('DayPickerNavigation__verticalDefault');
  });

  it('supports bottom navigation and inline style props', () => {
    const { container } = render(
      <DayPickerNavigation
        inlineStyles={{ backgroundColor: 'rgb(1, 2, 3)' }}
        navPosition="navPositionBottom"
      />,
    );

    expect(container.firstElementChild.className).toContain('DayPickerNavigation__bottom');
    expect(container.firstElementChild.style.backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('accepts the horizontal orientation explicitly', () => {
    render(<DayPickerNavigation orientation={HORIZONTAL_ORIENTATION} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
