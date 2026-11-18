import { test, expect } from '@playwright/test';
import LZString from 'lz-string';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('isDesignV2Enabled', 'true'));
});

test('shows welcome once, then opens Template after a reload', async ({ page }) => {
  await page.goto('/');
  const welcome = page.getByRole('button', { name: 'Start building →' });
  await expect(welcome).toBeVisible({ timeout: 30_000 });
  await welcome.click();
  await expect(page.getByRole('button', { name: /1 Template/ })).toHaveAttribute('aria-current', 'step');

  await page.reload();
  await expect(page.getByRole('button', { name: /1 Template/ })).toHaveAttribute('aria-current', 'step', { timeout: 30_000 });
  await expect(welcome).toHaveCount(0);

  await page.getByRole('button', { name: 'Playground menu' }).click();
  await page.getByRole('menuitem', { name: /Replay the introduction/ }).click();
  await expect(welcome).toBeVisible();
});

for (const prefix of ['#data=', '?data=']) {
  for (const returning of [false, true]) {
    test(`a broken ${prefix} link stays on welcome and shows its error (returning: ${returning})`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      if (returning) await page.addInitScript(() => localStorage.setItem('designV2WelcomeSeen', 'true'));
      await page.goto(`/${prefix}${LZString.compressToEncodedURIComponent('{}')}`);
      await expect(page.getByRole('button', { name: 'Start building →' })).toBeVisible();
      await expect(page.getByText('Failed to load shared content: Invalid share link data')).toBeVisible();
      const alert = await page.getByRole('alert').boundingBox();
      expect(alert).not.toBeNull();
      expect(alert!.x).toBeGreaterThanOrEqual(0);
      expect(alert!.x + alert!.width).toBeLessThanOrEqual(375);
      await expect(page.getByRole('button', { name: /2 Text/ })).toHaveCount(0);
    });
  }

  test(`a ${prefix} share link opens Text before the welcome preference`, async ({ page }) => {
    const payload = LZString.compressToEncodedURIComponent(JSON.stringify({
      templateMarkdown: 'Hello {{name}}!',
      modelCto: 'namespace hello@1.0.0\n@template\nconcept HelloWorld { o String name }',
      data: JSON.stringify({ $class: 'hello@1.0.0.HelloWorld', name: 'Ada' }),
      agreementHtml: '',
    }));
    await page.goto(`/${prefix}${payload}`);
    const text = page.getByRole('button', { name: /2 Text/ });
    await expect(text).toHaveAttribute('aria-current', 'step', { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Start building →' })).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('designV2WelcomeSeen'))).toBe('true');

    await page.getByRole('button', { name: '← Back', exact: true }).click();
    await expect(page.getByRole('button', { name: /1 Template/ })).toHaveAttribute('aria-current', 'step');
    // Same-document navigation keeps the V2 store alive, unlike a page reload.
    const nextPayload = LZString.compressToEncodedURIComponent(
      LZString.decompressFromEncodedURIComponent(payload).replace('Ada', 'Bea')
    );
    await page.evaluate((url) => {
      history.pushState({}, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    }, `/${prefix}${nextPayload}`);
    await expect(text).toHaveAttribute('aria-current', 'step', { timeout: 30_000 });
    // On reload the stored preference must not send a shared link to Template.
    await page.reload();
    await expect(text).toHaveAttribute('aria-current', 'step', { timeout: 30_000 });

    await page.evaluate((url) => {
      history.pushState({}, '', url);
      dispatchEvent(new PopStateEvent('popstate'));
    }, `/${prefix}${LZString.compressToEncodedURIComponent('{}')}`);
    await expect(page.getByRole('button', { name: 'Start building →' })).toBeVisible();
    await expect(page.getByText('Failed to load shared content: Invalid share link data')).toBeVisible();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('switch', { name: 'Use classic playground' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Samples:/ })).not.toContainText('Shared template');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('switch', { name: 'Use classic playground' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start building →' })).toBeVisible();
  });
}
