import { describe, expect, it } from 'vitest';

describe('modern test toolchain', () => {
  it('runs in a DOM environment', () => {
    const element = document.createElement('div');
    element.dataset.ready = 'true';

    expect(element.dataset.ready).toBe('true');
  });
});

