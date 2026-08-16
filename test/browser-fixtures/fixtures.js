import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

/**
 * Shared browser fixtures. Keep accessibility assertions explicit in each
 * scenario so a failing rule points to the relevant picker state.
 */
export const test = base.extend({
  a11y: async ({ page }, provide) => {
    await provide(async (options = {}) => {
      const results = await new AxeBuilder({ page })
        .withTags(options.tags || ['wcag2a', 'wcag2aa'])
        .disableRules(options.disableRules || [])
        .analyze();

      expect(results.violations, JSON.stringify(results.violations, null, 2))
        .toEqual([]);
      return results;
    });
  },
  visual: async ({ page }, provide, testInfo) => {
    await provide(async (name, options = {}) => {
      const snapshotName = name || testInfo.title.replace(/\W+/g, '-').toLowerCase();
      await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
        animations: 'disabled',
        ...options,
      });
    });
  },
});

export { expect };
