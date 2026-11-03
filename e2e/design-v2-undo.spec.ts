import { test, expect, type Page } from '@playwright/test';

// The project's Desktop Chrome profile emulates Windows, including Monaco's keymap.
const modifier = 'Control';
const marker = 'Undo history regression test';
const textEditor = (page: Page) => page.locator('.nd-view-text .monaco-editor');
const navigate = (page: Page, step: string) => page.locator('.nd-stepper').getByRole('button', { name: step }).click();

// Monaco virtualizes its DOM. Read the application's complete document so a
// marker scrolling out of view cannot be mistaken for a successful undo.
async function documentText(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const modulePath = '/src/store/store.ts';
    const { default: store } = await import(modulePath);
    return store.getState().editorValue as string;
  });
}

async function editText(page: Page) {
  await expect(textEditor(page)).toBeVisible();
  await textEditor(page).click();
  await page.keyboard.press(`${modifier}+End`);
  await page.keyboard.press('Enter');
  await page.keyboard.type(marker);
  await expect.poll(() => documentText(page)).toContain(marker);
}

async function roundTrip(page: Page) {
  await navigate(page, 'Data');
  await expect(textEditor(page)).toBeHidden();
  await navigate(page, 'Text');
  await expect(textEditor(page)).toBeVisible();
  await textEditor(page).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('isDesignV2Enabled', 'true');
    localStorage.setItem('hasVisited', 'true');
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Start building/ }).click();
  await page.getByRole('button', { name: 'Start with Consulting Agreement', exact: true }).click();
  await expect(textEditor(page)).toBeVisible({ timeout: 30000 });
});

test('undo and redo survive repeated step navigation', async ({ page }) => {
  await editText(page);
  const editedText = await documentText(page);
  await page.keyboard.press(`${modifier}+z`);
  await expect.poll(() => documentText(page)).not.toContain(marker);
  await page.keyboard.press(`${modifier}+Shift+z`);
  await expect.poll(() => documentText(page)).toBe(editedText);
  await roundTrip(page);
  await page.keyboard.press(`${modifier}+z`);
  await expect.poll(() => documentText(page)).not.toContain(marker);
  // Preserve the redo stack too, not only the current text or undo stack.
  await roundTrip(page);
  await page.keyboard.press(`${modifier}+Shift+z`);
  await expect.poll(() => documentText(page)).toBe(editedText);
  await roundTrip(page);
  await page.keyboard.press(`${modifier}+z`);
  await expect.poll(() => documentText(page)).not.toContain(marker);
});

for (const template of ['Consulting Agreement', 'Residential Lease']) {
  test(`loading ${template} clears the previous template's undo history`, async ({ page }) => {
    await editText(page);
    await navigate(page, 'Template');
    await page.getByRole('button', { name: `Start with ${template}`, exact: true }).click();
    await expect(textEditor(page)).toBeVisible();
    await expect.poll(() => documentText(page)).not.toContain(marker);
    const freshText = await documentText(page);
    expect(freshText).not.toBe('');
    await textEditor(page).click();
    await page.keyboard.press(`${modifier}+z`);
    await expect.poll(() => documentText(page)).toBe(freshText);
    await page.keyboard.press(`${modifier}+Shift+z`);
    await expect.poll(() => documentText(page)).toBe(freshText);
  });
}
