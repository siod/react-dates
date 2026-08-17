import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import KeyboardShortcutRow from '../../../src/components/KeyboardShortcutRow.jsx';

afterEach(cleanup);

describe('KeyboardShortcutRow observable behavior', () => {
  it('renders a list item with an accessible key label and action', () => {
    render(
      <ul>
        <KeyboardShortcutRow
          action="Select the focused date"
          label="Enter key"
          unicode="↵"
        />
      </ul>,
    );

    expect(screen.getByRole('listitem')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Enter key,' }).textContent).toContain('↵');
    expect(screen.getByText('Select the focused date')).toBeTruthy();
  });

  it('renders block mode without changing the shortcut semantics', () => {
    render(
      <ul>
        <KeyboardShortcutRow
          action="Move by one week"
          block
          label="Arrow keys"
          unicode="↑/↓"
        />
      </ul>,
    );

    expect(screen.getByRole('listitem').className).toContain('KeyboardShortcutRow__block');
    expect(screen.getByRole('img', { name: 'Arrow keys,' }).textContent).toContain('↑/↓');
    expect(screen.getByText('Move by one week')).toBeTruthy();
  });
});
