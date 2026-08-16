import { useEffect } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderStrict } from '../helpers/index.js';

function MountProbe() {
  useEffect(() => {
    // StrictMode invokes setup/cleanup/setup in development.
    return undefined;
  }, []);

  return <output aria-label="mount count">ready</output>;
}

describe('StrictMode render harness', () => {
  it('exercises the development mount cycle and returns Testing Library queries', () => {
    const view = renderStrict(<MountProbe />);

    expect(view.unmount).toEqual(expect.any(Function));
    expect(screen.getByLabelText('mount count')).toBeTruthy();
  });
});
