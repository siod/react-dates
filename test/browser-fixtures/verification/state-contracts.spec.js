import { expect, test } from '../fixtures.js';

const stories = {
  rangeInitiallySelected: '/iframe.html?id=examples-daterangepicker--initially-selected&viewMode=story',
  blockedWeekends: '/iframe.html?id=examples-singledatepicker--blocked-weekends&viewMode=story',
  singleVertical: '/iframe.html?id=examples-singledatepicker--vertical&viewMode=story',
  rangeVertical: '/iframe.html?id=examples-daterangepicker--vertical&viewMode=story',
  singlePortal: '/iframe.html?id=examples-singledatepicker--portal&viewMode=story',
  singleDefault: '/iframe.html?id=examples-singledatepicker--default&viewMode=story',
  rangeRtl: '/iframe.html?id=examples-daterangepicker--right-to-left&viewMode=story',
};

async function openPicker(page, story, inputIndex = 0) {
  await page.goto(story);
  const input = page.locator('input').nth(inputIndex);
  await input.waitFor();
  await input.click();
  await expect(page.locator('.DayPicker')).toBeVisible();
  return input;
}

test.describe('public picker state contracts', () => {
  test('keeps selected range endpoints and exposes a hovered preview', async ({ page, a11y }) => {
    await openPicker(page, stories.rangeInitiallySelected);

    await expect(page.locator('.CalendarDay__selected_start')).toHaveCount(1);
    await expect(page.locator('.CalendarDay__selected_end')).toHaveCount(1);
    await expect(page.locator('.CalendarDay__selected_span')).toHaveCount(4);

    const hoverTarget = page.locator(
      '.CalendarMonth[data-visible="true"] .CalendarDay[aria-disabled="false"]',
    ).last();
    await expect(hoverTarget).toBeVisible();
    await hoverTarget.hover();
    expect(await page.locator('.CalendarDay__hovered_span').count()).toBeGreaterThan(1);
    await a11y({ disableRules: ['color-contrast'] });
  });

  test('marks blocked weekend dates unavailable and ignores blocked clicks', async ({ page, a11y }) => {
    const input = await openPicker(page, stories.blockedWeekends);
    const blockedDay = page.locator(
      '.CalendarMonth[data-visible="true"] .CalendarDay__blocked_calendar[aria-disabled="true"]',
    ).first();

    await expect(blockedDay).toBeVisible();
    await expect(blockedDay).toHaveAttribute('aria-label', /^Not available\./);
    await blockedDay.click({ force: true });
    await expect(input).toHaveValue('');
    await expect(page.locator('.DayPicker')).toBeVisible();
    await a11y({ disableRules: ['color-contrast'] });
  });

  test('renders a vertical single-date calendar with a bounded scroll region', async ({ page }) => {
    await openPicker(page, stories.singleVertical);

    await expect(page.locator('.DayPicker_transitionContainer__vertical')).toBeVisible();
    await expect(page.locator('.DayPicker_weekHeader__vertical')).toBeVisible();
    const transition = page.locator('.DayPicker_transitionContainer__vertical');
    const box = await transition.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThan(500);
    expect(await transition.evaluate((element) => element.scrollHeight)).toBeGreaterThan(
      await transition.evaluate((element) => element.clientHeight),
    );
  });

  test('keeps a vertical range picker usable at a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await openPicker(page, stories.rangeVertical);

    await expect(page.locator('.DayPicker_transitionContainer__vertical')).toBeVisible();
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(clientWidth);
    const picker = page.locator('.DateRangePicker_picker');
    const pickerBox = await picker.boundingBox();
    expect(pickerBox).not.toBeNull();
    expect(pickerBox.x).toBeGreaterThanOrEqual(0);
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(clientWidth);
  });

  test('mounts a single-date portal and removes it on Escape', async ({ page }) => {
    const input = await openPicker(page, stories.singlePortal);

    await expect(page.locator('.SingleDatePicker_picker__portal')).toBeVisible();
    await expect(page.locator('.DayPicker_portal__horizontal')).toBeVisible();
    await expect(page.locator('.CalendarDay[tabindex="0"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.SingleDatePicker_picker__portal')).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test('opens and closes the keyboard shortcuts dialog from the picker', async ({ page }) => {
    await openPicker(page, stories.singleDefault);

    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard Shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Select the date in focus.');
    await dialog.getByRole('button', { name: 'Close the shortcuts panel.' }).click();
    await expect(dialog).toBeHidden();
  });

  test('preserves RTL direction and accessible range inputs', async ({ page, a11y }) => {
    await openPicker(page, stories.rangeRtl);

    await expect(page.locator('[dir="rtl"]').first()).toBeVisible();
    await expect(page.locator('.DayPicker')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('#startDate')).toBeVisible();
    await expect(page.locator('#endDate')).toBeVisible();
    await a11y({ disableRules: ['color-contrast'] });
  });
});
