import { expect, test } from './fixtures.js';

test.describe('modern browser harness', () => {
  test('can navigate to the configured preview', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
  });
});
