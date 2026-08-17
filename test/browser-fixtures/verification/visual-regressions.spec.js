import { expect, test } from '../fixtures.js';

const stories = {
  defaultSingle: '/iframe.html?id=verification-visual--default-single&viewMode=story',
  rangePreview: '/iframe.html?id=verification-visual--range-preview&viewMode=story',
  disabledDates: '/iframe.html?id=verification-visual--disabled-dates&viewMode=story',
  rtl: '/iframe.html?id=verification-visual--right-to-left&viewMode=story',
  vertical: '/iframe.html?id=verification-visual--vertical&viewMode=story',
  portal: '/iframe.html?id=verification-visual--portal&viewMode=story',
  shortcuts: '/iframe.html?id=verification-visual--keyboard-shortcuts&viewMode=story',
  narrowRange: '/iframe.html?id=verification-visual--narrow-range&viewMode=story',
};

const visualOptions = {
  maxDiffPixelRatio: 0.03,
};

test.describe('picker visual regressions', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium owns visual baselines.');

  test('default single-date picker', async ({ page, visual }) => {
    await page.goto(stories.defaultSingle);
    await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
    await visual('default-single', visualOptions);
  });

  test('selected and hovered range', async ({ page, visual }) => {
    await page.goto(stories.rangePreview);
    const picker = page.locator('.DateRangePicker_picker');
    await expect(picker).toBeVisible();
    await picker.locator(
      '.CalendarMonth[data-visible="true"] .CalendarDay[aria-disabled="false"]',
    ).nth(16).hover();
    await expect(picker.locator('.CalendarDay__hovered_span').first()).toBeVisible();
    await visual('selected-hovered-range', visualOptions);
  });

  test('disabled dates', async ({ page, visual }) => {
    await page.goto(stories.disabledDates);
    await expect(page.locator(
      '.CalendarMonth[data-visible="true"] .CalendarDay__blocked_calendar',
    ).first()).toBeVisible();
    await visual('disabled-dates', visualOptions);
  });

  test('RTL layout', async ({ page, visual }) => {
    await page.goto(stories.rtl);
    await expect(page.locator('.DayPicker')).toHaveAttribute('dir', 'rtl');
    await visual('rtl-single', visualOptions);
  });

  test('vertical layout', async ({ page, visual }) => {
    await page.goto(stories.vertical);
    await expect(page.locator('.DayPicker_transitionContainer__vertical')).toBeVisible();
    await visual('vertical-single', visualOptions);
  });

  test('portal layout', async ({ page, visual }) => {
    await page.goto(stories.portal);
    await expect(page.locator('.SingleDatePicker_picker__portal')).toBeVisible();
    await visual('portal-single', { ...visualOptions, fullPage: true });
  });

  test('keyboard shortcuts panel', async ({ page, visual }) => {
    await page.goto(stories.shortcuts);
    await page.getByRole('button', { name: 'Open the keyboard shortcuts panel.' }).click();
    await expect(page.getByRole('dialog', { name: 'Keyboard Shortcuts' })).toBeVisible();
    await visual('keyboard-shortcuts', visualOptions);
  });

  test('narrow responsive range picker', async ({ page, visual }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto(stories.narrowRange);
    await expect(page.locator('.DateRangePicker_picker')).toBeVisible();
    await visual('narrow-range', visualOptions);
  });
});
