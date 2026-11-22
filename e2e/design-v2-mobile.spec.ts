import { test, expect } from '@playwright/test';

/**
 * Design v2 at a phone width. Under 960px the editor column and the help rail
 * stack, and the editor still has to leave room to read and edit the template.
 */
test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 390, height: 844 },
});

test.describe('Design v2 at mobile widths', () => {
  test('the Text step editor keeps a usable height', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Got it' }).click();
    await page.getByRole('button', { name: /Start building/ }).click();
    await page.getByRole('button', { name: 'Start with Consulting Agreement' }).click();

    const editor = page.getByRole('region', { name: 'Text' }).locator('.monaco-editor');
    await expect(editor).toBeVisible({ timeout: 30000 });

    const box = await editor.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(200);
  });
});
