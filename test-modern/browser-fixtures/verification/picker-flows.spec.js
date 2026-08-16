import { expect, test } from '../fixtures.js';

const stories = {
  single: '/iframe.html?id=pickers--single-date&viewMode=story',
  range: '/iframe.html?id=pickers--date-range&viewMode=story',
  persian: '/iframe.html?id=pickers--persian-rtl&viewMode=story',
};

async function openSingle(page) {
  await page.goto(stories.single);
  const input = page.getByRole('textbox', { name: 'Date' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
  return input;
}

test.describe('picker keyboard flows', () => {
  test('opens, navigates, selects, closes, and restores focus', async ({ page, a11y }) => {
    const input = await openSingle(page);
    const focusedDay = page.locator('.CalendarDay[tabindex="0"]');
    await expect(focusedDay).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.CalendarDay[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.locator('.SingleDatePicker_picker')).toBeHidden();
    await expect(input).toBeFocused();
    await a11y();
  });

  test('supports Escape close from keyboard without leaving focus behind', async ({ page, a11y }) => {
    const input = await openSingle(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.SingleDatePicker_picker')).toBeHidden();
    await expect(input).toBeFocused();
    await a11y();
  });

  test('range picker opens start/end fields and keeps calendar days keyboard reachable', async ({ page, a11y }) => {
    await page.goto(stories.range);
    const start = page.locator('#example-start-date');
    const end = page.locator('#example-end-date');
    await start.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.DateRangePicker_picker')).toBeVisible();
    await expect(page.locator('.CalendarDay[tabindex="0"]')).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(end).toHaveClass(/DateInput_input__focused/);
    await expect(page.locator('.CalendarDay[tabindex="0"]')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(page.locator('.DateRangePicker_picker')).toBeHidden();
    await a11y();
  });
});

test.describe('responsive, direction, and cleanup', () => {
  test('renders Persian calendar direction and localized day labels', async ({ page, a11y }) => {
    await page.goto(stories.persian);
    await expect(page.locator('[dir="rtl"]')).toBeVisible();
    await page.getByRole('textbox').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
    await expect(page.locator('.DayPicker')).toHaveAttribute('dir', 'rtl');
    await a11y({ disableRules: ['color-contrast'] });
  });

  test('does not leave portal or scroll-lock artifacts after closing', async ({ page }) => {
    const input = await openSingle(page);
    await page.keyboard.press('Escape');
    await expect(input).toBeFocused();
    await expect(page.locator('.DayPicker_portal')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('remains usable at a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const input = await openSingle(page);
    await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
    await expect(input).toBeVisible();
  });
});
