import { test, expect } from '@playwright/test';

test.describe('Share Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should have Share button in sidebar', async ({ page }) => {
    const shareButton = page.getByRole('button', { name: 'Share' });
    await expect(shareButton).toBeVisible();
  });

  test('should copy shareable link to clipboard on Share click', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const shareButton = page.getByRole('button', { name: 'Share' });
    await shareButton.click();

    await expect(page.getByText('Link copied to clipboard')).toBeVisible({ timeout: 5000 });

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('data=');
  });

  test('should load template from shared URL', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const shareButton = page.getByRole('button', { name: 'Share' });
    await shareButton.click();

    await expect(page.getByText('Link copied to clipboard')).toBeVisible({ timeout: 5000 });

    const shareableLink = await page.evaluate(() => navigator.clipboard.readText());
    
    expect(shareableLink, 'Shareable link should be a non-empty string').toBeTruthy();
    expect(typeof shareableLink, 'Shareable link should be a string').toBe('string');

    let url: URL;
    try {
      url = new URL(shareableLink);
    } catch (error) {
      throw new Error(`Failed to parse shareable link as URL: "${shareableLink}". Error: ${error}`);
    }

    const hashParams = new URLSearchParams(url.hash.slice(1));
    const dataParam = hashParams.get('data');
    expect(
      dataParam,
      `URL should contain a "data" parameter in hash. Received URL: "${shareableLink}"`
    ).toBeTruthy();

    await page.goto(`/#data=${dataParam}`);

    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    await expect(page.locator('.main-container-agreement')).toBeVisible();
  });

  test('should have Start Tour button', async ({ page }) => {
    const tourButton = page.getByRole('button', { name: 'Start Tour' });
    await expect(tourButton).toBeVisible();
  });

  test('should have Settings button', async ({ page }) => {
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
  });

  test('should display error toast and fallback to default state on corrupted share link', async ({ page }) => {
    await page.goto('/#data=invalid_garbage_base64_string');
    
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 10000 });
    
    const errorMessage = page.locator('.ant-message-notice-content', { hasText: 'Failed to load shared workspace. The link data may be corrupted.' });
    await expect(errorMessage).toBeVisible();

    await expect(page.locator('.agreement')).toContainText('Acme Corp', { timeout: 15000 });
  });
});