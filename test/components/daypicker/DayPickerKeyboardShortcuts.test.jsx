import React from 'react';
import {
  cleanup, createEvent, fireEvent, render, screen, within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DayPickerKeyboardShortcutsPhrases } from '../../../src/defaultPhrases.js';
import DayPickerKeyboardShortcuts from '../../../src/components/DayPickerKeyboardShortcuts.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const phrases = DayPickerKeyboardShortcutsPhrases;

describe('DayPickerKeyboardShortcuts observable behavior', () => {
  it('renders the toggle button with the localized accessible name', () => {
    const { rerender } = render(<DayPickerKeyboardShortcuts />);
    expect(screen.getByRole('button', { name: phrases.showKeyboardShortcutsPanel })).toBeTruthy();

    const customShow = 'Show keyboard help';
    rerender(
      <DayPickerKeyboardShortcuts
        phrases={{ ...phrases, showKeyboardShortcutsPanel: customShow }}
      />,
    );
    expect(screen.getByRole('button', { name: customShow })).toBeTruthy();
  });

  it('opens the panel through the callback and returns focus through its close callback', () => {
    const openKeyboardShortcutsPanel = vi.fn();
    render(<DayPickerKeyboardShortcuts openKeyboardShortcutsPanel={openKeyboardShortcutsPanel} />);

    const toggle = screen.getByRole('button', { name: phrases.showKeyboardShortcutsPanel });
    toggle.focus();
    fireEvent.click(toggle);
    expect(openKeyboardShortcutsPanel).toHaveBeenCalledTimes(1);

    const onClose = openKeyboardShortcutsPanel.mock.calls[0][0];
    expect(typeof onClose).toBe('function');
    onClose();
    expect(document.activeElement).toBe(toggle);
  });

  it('renders a dialog with linked title, description, close control, and seven shortcuts', () => {
    render(<DayPickerKeyboardShortcuts showKeyboardShortcutsPanel />);

    const dialog = screen.getByRole('dialog');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby'));
    const description = document.getElementById(dialog.getAttribute('aria-describedby'));
    expect(title.textContent).toContain(phrases.keyboardShortcuts);
    expect(description.tagName).toBe('UL');
    expect(within(dialog).getByRole('button', { name: phrases.hideKeyboardShortcutsPanel })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('focuses the close control when the panel is shown and closes on click', async () => {
    const closeKeyboardShortcutsPanel = vi.fn();
    const { rerender } = render(
      <DayPickerKeyboardShortcuts closeKeyboardShortcutsPanel={closeKeyboardShortcutsPanel} />,
    );
    rerender(
      <DayPickerKeyboardShortcuts
        closeKeyboardShortcutsPanel={closeKeyboardShortcutsPanel}
        showKeyboardShortcutsPanel
      />,
    );

    const close = within(screen.getByRole('dialog'))
      .getByRole('button', { name: phrases.hideKeyboardShortcutsPanel });
    await vi.waitFor(() => expect(document.activeElement).toBe(close));
    fireEvent.click(close);
    expect(closeKeyboardShortcutsPanel).toHaveBeenCalledTimes(1);
  });

  it('applies the keyboard panel event policy to navigation keys', () => {
    const closeKeyboardShortcutsPanel = vi.fn();
    render(
      <DayPickerKeyboardShortcuts
        closeKeyboardShortcutsPanel={closeKeyboardShortcutsPanel}
        showKeyboardShortcutsPanel
      />,
    );
    const close = within(screen.getByRole('dialog'))
      .getByRole('button', { name: phrases.hideKeyboardShortcutsPanel });

    ['Tab', 'Home', 'End', 'PageUp', 'PageDown', 'ArrowLeft', 'ArrowRight'].forEach((key) => {
      const event = createEvent.keyDown(close, { key });
      fireEvent(close, event);
      expect(event.defaultPrevented, key).toBe(true);
    });
    ['ArrowUp', 'ArrowDown', 'Enter', ' '].forEach((key) => {
      const event = createEvent.keyDown(close, { key });
      fireEvent(close, event);
      expect(event.defaultPrevented, key).toBe(false);
    });
    expect(closeKeyboardShortcutsPanel).not.toHaveBeenCalled();
  });

  it('closes the panel when Escape is pressed', () => {
    const closeKeyboardShortcutsPanel = vi.fn();
    render(
      <DayPickerKeyboardShortcuts
        closeKeyboardShortcutsPanel={closeKeyboardShortcutsPanel}
        showKeyboardShortcutsPanel
      />,
    );
    fireEvent.keyDown(
      within(screen.getByRole('dialog'))
        .getByRole('button', { name: phrases.hideKeyboardShortcutsPanel }),
      { key: 'Escape' },
    );
    expect(closeKeyboardShortcutsPanel).toHaveBeenCalledTimes(1);
  });

  it('supports a custom toggle button and passes its accessibility props', () => {
    const openKeyboardShortcutsPanel = vi.fn();
    const renderKeyboardShortcutsButton = vi.fn(({ ariaLabel, onClick, ref }) => (
      <button aria-label={ariaLabel} onClick={onClick} ref={ref} type="button">
        Help
      </button>
    ));
    render(
      <DayPickerKeyboardShortcuts
        openKeyboardShortcutsPanel={openKeyboardShortcutsPanel}
        renderKeyboardShortcutsButton={renderKeyboardShortcutsButton}
      />,
    );

    expect(renderKeyboardShortcutsButton).toHaveBeenCalledWith(expect.objectContaining({
      ariaLabel: phrases.showKeyboardShortcutsPanel,
      onClick: expect.any(Function),
      ref: expect.any(Function),
    }));
    fireEvent.click(screen.getByRole('button', { name: phrases.showKeyboardShortcutsPanel }));
    expect(openKeyboardShortcutsPanel).toHaveBeenCalledTimes(1);
  });

  it('supports a custom panel render callback with all shortcut data', () => {
    const closeKeyboardShortcutsPanel = vi.fn();
    const renderKeyboardShortcutsPanel = vi.fn((props) => (
      <section>
        <h2>{props.title}</h2>
        <button onClick={props.onCloseButtonClick} type="button">Close help</button>
        <span>{props.keyboardShortcuts.length}</span>
      </section>
    ));
    render(
      <DayPickerKeyboardShortcuts
        closeKeyboardShortcutsPanel={closeKeyboardShortcutsPanel}
        renderKeyboardShortcutsPanel={renderKeyboardShortcutsPanel}
        showKeyboardShortcutsPanel
      />,
    );

    expect(renderKeyboardShortcutsPanel).toHaveBeenCalledWith(expect.objectContaining({
      closeButtonAriaLabel: phrases.hideKeyboardShortcutsPanel,
      keyboardShortcuts: expect.arrayContaining([
        expect.objectContaining({ unicode: '↵' }),
      ]),
      onCloseButtonClick: closeKeyboardShortcutsPanel,
      onKeyDown: expect.any(Function),
      title: phrases.keyboardShortcuts,
    }));
    expect(screen.getByText('7')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(closeKeyboardShortcutsPanel).toHaveBeenCalledTimes(1);
  });
});
