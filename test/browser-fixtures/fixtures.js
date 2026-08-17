import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

const AXE_RUNNING_ERROR = 'Axe is already running';
const AXE_RUN_ATTEMPTS = 5;

async function analyzeAccessibility(page, options) {
  let lastError;

  for (let attempt = 0; attempt < AXE_RUN_ATTEMPTS; attempt += 1) {
    await page.waitForFunction(() => !globalThis.axe?._running);

    try {
      return await new AxeBuilder({ page })
        .withTags(options.tags || ['wcag2a', 'wcag2aa'])
        .disableRules(options.disableRules || [])
        .analyze();
    } catch (error) {
      if (!error.message.includes(AXE_RUNNING_ERROR)) throw error;
      lastError = error;
      await page.waitForTimeout(50);
    }
  }

  throw lastError;
}

/**
 * Shared browser fixtures. Keep accessibility assertions explicit in each
 * scenario so a failing rule points to the relevant picker state.
 */
export const test = base.extend({
  a11y: async ({ page }, provide) => {
    await provide(async (options = {}) => {
      const results = await analyzeAccessibility(page, options);

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
