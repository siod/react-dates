import { expect, test } from '../fixtures.js';

const stories = {
  single: '/iframe.html?id=pickers--single-date&viewMode=story',
  singleWithControls: '/iframe.html?id=pickers--single-date-with-controls&viewMode=story',
  range: '/iframe.html?id=pickers--date-range&viewMode=story',
  rtl: '/iframe.html?id=pickers--arabic-rtl&viewMode=story',
};

async function openSingle(page) {
  await page.goto(stories.single);
  const input = page.getByRole('textbox', { name: 'Date' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
  await expect(page.locator('.CalendarDay[tabindex="0"]')).toBeFocused();
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
    const focusedEndDay = page.locator('.CalendarDay[tabindex="0"]');
    const focusedEndDayLabel = await focusedEndDay.getAttribute('aria-label');
    await page.keyboard.press('ArrowRight');
    await expect(focusedEndDay).not.toHaveAttribute('aria-label', focusedEndDayLabel);
    await expect(focusedEndDay).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('.DateRangePicker_picker')).toBeHidden();
    await a11y();
  });

  test('range picker opens and previews a hovered range with pointer input', async ({ page }) => {
    await page.goto(stories.range);
    await page.locator('#example-start-date').click();
    const picker = page.locator('.DateRangePicker_picker');
    await expect(picker).toBeVisible();
    expect(await picker.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');

    const availableDays = picker.locator(
      '.CalendarMonth[data-visible="true"] .CalendarDay[aria-disabled="false"]',
    );
    await availableDays.first().click();
    await availableDays.nth(5).hover();
    await expect(picker.locator('.CalendarDay__hovered_span').first()).toBeVisible();
    expect(await picker.locator('.CalendarDay__hovered_span').count()).toBeGreaterThan(1);
  });
});

test.describe('single picker pointer flows', () => {
  test('keeps the input underline inside the picker border', async ({ page }) => {
    await page.goto(stories.single);

    const pickerInput = page.locator('.SingleDatePickerInput');
    const input = page.getByRole('textbox', { name: 'Date' });
    const [pickerBox, inputBox] = await Promise.all([
      pickerInput.boundingBox(),
      input.boundingBox(),
    ]);

    expect(pickerBox).not.toBeNull();
    expect(inputBox).not.toBeNull();
    expect(inputBox.x).toBeGreaterThanOrEqual(pickerBox.x);
    expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(pickerBox.x + pickerBox.width);
  });

  test('uses the original single-picker calendar layout structure', async ({ page }) => {
    await page.goto(stories.single);
    await page.getByRole('textbox', { name: 'Date' }).click();

    const picker = page.locator('.SingleDatePicker_picker');
    expect(await picker.evaluate((element) => getComputedStyle(element).boxShadow)).not.toBe('none');
    const [caretBox, pickerBox, stacking] = await Promise.all([
      page.locator('.DateInput_fang').boundingBox(),
      picker.boundingBox(),
      page.evaluate(() => ({
        caret: Number(getComputedStyle(document.querySelector('.DateInput_fang')).zIndex),
        picker: Number(getComputedStyle(document.querySelector('.SingleDatePicker_picker')).zIndex),
      })),
    ]);
    expect(caretBox.y + caretBox.height).toBeGreaterThan(pickerBox.y);
    expect(stacking.caret).toBeGreaterThan(stacking.picker);
    await expect(picker.locator('.DayPicker')).toHaveClass(/DayPicker__horizontal/);
    await expect(picker.locator('.DayPicker')).toHaveClass(/DayPicker__withBorder/);
    await expect(picker.locator('.DayPicker_weekHeader')).toHaveCount(1);
    await expect(picker.locator('.DayPicker_weekHeader_li')).toHaveCount(7);
    await expect(picker.locator('.DayPicker_transitionContainer')).toBeVisible();

    const transitionBox = await picker.locator('.DayPicker_transitionContainer').boundingBox();
    expect(transitionBox.height).toBeGreaterThan(250);
  });

  test('opens, navigates, selects, and closes with pointer input', async ({ page }) => {
    await page.goto(stories.single);
    const input = page.getByRole('textbox', { name: 'Date' });

    await input.click();
    const picker = page.locator('.SingleDatePicker_picker');
    await expect(picker).toBeVisible();

    const visibleMonth = picker.locator('.CalendarMonth[data-visible="true"] strong');
    const initialMonth = await visibleMonth.textContent();
    await page.getByRole('button', { name: 'Move forward to switch to the next month.' }).click();
    await expect(visibleMonth).not.toHaveText(initialMonth);

    await picker.locator('.CalendarMonth[data-visible="true"] .CalendarDay[aria-disabled="false"]').first().click();
    await expect(input).not.toHaveValue('');
    await expect(picker).toBeHidden();
    await expect(input).not.toBeFocused();
  });

  test('moves keyboard focus into the previous month at the visible boundary', async ({ page }) => {
    await openSingle(page);
    const visibleMonth = page.locator('.CalendarMonth[data-visible="true"] strong');
    const initialMonth = await visibleMonth.textContent();

    await page.keyboard.press('ArrowLeft');

    await expect(visibleMonth).not.toHaveText(initialMonth);
    await expect(page.locator('.CalendarMonth[data-visible="true"] .CalendarDay[tabindex="0"]')).toBeFocused();
  });

  test('accepts typed localized dates and closes on outside pointer input', async ({ page }) => {
    await page.goto(stories.single);
    const input = page.getByRole('textbox', { name: 'Date' });

    await input.fill('17/08/2027');
    await expect(input).toHaveValue(/^17\/8\/(?:27|2027)$/);
    await expect(page.locator('.SingleDatePicker_picker')).toBeHidden();

    await input.click();
    await expect(page.locator('.SingleDatePicker_picker')).toBeVisible();
    await page.mouse.click(20, 20);
    await expect(page.locator('.SingleDatePicker_picker')).toBeHidden();
  });

  test('opens from the calendar icon and clears through the original controls', async ({ page }) => {
    await page.goto(stories.singleWithControls);
    const input = page.getByRole('textbox', { name: 'Date' });

    await page.getByRole('button', { name: 'Open calendar.' }).click();
    const picker = page.locator('.SingleDatePicker_picker');
    await expect(picker).toBeVisible();
    await picker.locator('.CalendarMonth[data-visible="true"] .CalendarDay[aria-disabled="false"]').first().click();
    await expect(input).not.toHaveValue('');

    await page.getByRole('button', { name: 'Clear Date' }).click();
    await expect(input).toHaveValue('');
    await expect(picker).toBeVisible();
  });
});

test.describe('responsive, direction, and cleanup', () => {
  test('renders RTL direction and localized day labels', async ({ page, a11y }) => {
    await page.goto(stories.rtl);
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
    await page.setViewportSize({ width: 360, height: 700 });
    const input = await openSingle(page);
    const picker = page.locator('.SingleDatePicker_picker');
    await expect(picker).toBeVisible();
    await expect(input).toBeVisible();

    const pickerBox = await picker.boundingBox();
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(pickerBox.x).toBeGreaterThanOrEqual(0);
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(clientWidth);
  });

  test('keeps a wide range calendar scrollable inside a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto(stories.range);
    await page.locator('#example-start-date').click();

    const picker = page.locator('.DateRangePicker_picker');
    await expect(picker).toBeVisible();

    const pickerBox = await picker.boundingBox();
    const metrics = await picker.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(pickerBox.x).toBeGreaterThanOrEqual(0);
    expect(pickerBox.x + pickerBox.width).toBeLessThanOrEqual(clientWidth);
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(clientWidth);
  });
});
