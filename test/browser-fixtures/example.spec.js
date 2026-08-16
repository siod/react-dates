import { expect, test } from './fixtures.js';

test.describe('public picker', () => {
  test('opens with keyboard focus and has no automatic accessibility violations', async ({
    a11y,
    page,
  }) => {
    await page.goto('/iframe.html?id=pickers--single-date&viewMode=story');

    const input = page.getByRole('textbox', { name: 'Date' });
    await input.focus();
    await page.keyboard.press('ArrowDown');

    await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
    await expect(page.locator('.CalendarDay[tabindex="0"]')).toBeVisible();
    await a11y();
  });
});
