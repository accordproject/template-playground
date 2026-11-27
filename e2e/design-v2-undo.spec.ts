import { test, expect, type Page } from '@playwright/test';

// The project's Desktop Chrome profile emulates Windows, including Monaco's keymap.
const modifier = 'Control';
const marker = 'Undo history regression test';
const textEditor = (page: Page) => page.locator('.nd-view-text .monaco-editor');
const navigate = (page: Page, step: string) => page.locator('.nd-stepper').getByRole('button', { name: step }).click();

// The Text step's Copy button reads the entire editor document, including lines
// that Monaco has scrolled out of the DOM.
async function copyDocumentText(page: Page) {
  await page.locator('.nd-view-text').getByRole('button', { name: /copy/i }).click();
  return page.evaluate(() => navigator.clipboard.readText());
}

async function pressEditorKey(page: Page, key: string) {
  await textEditor(page).click();
  await page.keyboard.press(key);
}

async function editText(page: Page) {
  await expect(textEditor(page)).toBeVisible();
  await pressEditorKey(page, `${modifier}+End`);
  await page.keyboard.press('Enter');
  await page.keyboard.type(marker);
  await expect.poll(() => copyDocumentText(page)).toContain(marker);
}

async function roundTrip(page: Page) {
  await navigate(page, 'Data');
  await expect(textEditor(page)).toBeHidden();
  await navigate(page, 'Text');
  await expect(textEditor(page)).toBeVisible();
}

test.beforeEach(async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
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
  const editedText = await copyDocumentText(page);
  await pressEditorKey(page, `${modifier}+z`);
  await expect.poll(() => copyDocumentText(page)).not.toContain(marker);
  await pressEditorKey(page, `${modifier}+Shift+z`);
  await expect.poll(() => copyDocumentText(page)).toBe(editedText);
  await roundTrip(page);
  await pressEditorKey(page, `${modifier}+z`);
  await expect.poll(() => copyDocumentText(page)).not.toContain(marker);
  // Preserve the redo stack too, not only the current text or undo stack.
  await roundTrip(page);
  await pressEditorKey(page, `${modifier}+Shift+z`);
  await expect.poll(() => copyDocumentText(page)).toBe(editedText);
  await roundTrip(page);
  await pressEditorKey(page, `${modifier}+z`);
  await expect.poll(() => copyDocumentText(page)).not.toContain(marker);
});

test('opening the current gallery card preserves the editor history', async ({ page }) => {
  await editText(page);
  await navigate(page, 'Template');
  await page.getByRole('button', { name: 'Start with Consulting Agreement', exact: true }).click();
  await expect.poll(() => copyDocumentText(page)).toContain(marker);
  await pressEditorKey(page, `${modifier}+z`);
  await expect.poll(() => copyDocumentText(page)).not.toContain(marker);
});

test('switching samples clears undo and redo history', async ({ page }) => {
  await editText(page);
  await navigate(page, 'Template');
  await page.getByRole('button', { name: 'Start with Residential Lease', exact: true }).click();
  await expect.poll(() => copyDocumentText(page)).not.toContain(marker);
  const freshText = await copyDocumentText(page);
  expect(freshText).not.toBe('');
  await pressEditorKey(page, `${modifier}+z`);
  await expect.poll(() => copyDocumentText(page)).toBe(freshText);
  await pressEditorKey(page, `${modifier}+Shift+z`);
  await expect.poll(() => copyDocumentText(page)).toBe(freshText);
});
