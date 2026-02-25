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
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const shareButton = page.getByRole('button', { name: 'Share' });
    await shareButton.click();

    // Should show success message
    await expect(page.getByText('Link copied to clipboard')).toBeVisible({ timeout: 5000 });

    // Verify clipboard contains the link with data parameter
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('data=');
  });

  test('should load template from shared URL', async ({ page }) => {
    // First, get a shareable link by clicking share
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const shareButton = page.getByRole('button', { name: 'Share' });
    await shareButton.click();

    // Wait for clipboard to be populated
    await expect(page.getByText('Link copied to clipboard')).toBeVisible({ timeout: 5000 });

    // Get the shareable link from clipboard
    const shareableLink = await page.evaluate(() => navigator.clipboard.readText());
    
    // Validate that we got a non-empty string
    expect(shareableLink, 'Shareable link should be a non-empty string').toBeTruthy();
    expect(typeof shareableLink, 'Shareable link should be a string').toBe('string');

    // Parse URL with validation
    let url: URL;
    try {
      url = new URL(shareableLink);
    } catch (error) {
      throw new Error(`Failed to parse shareable link as URL: "${shareableLink}". Error: ${error}`);
    }

    // The app uses hash-based routing (#data=...) not query params (?data=...)
    // Extract data from hash fragment
    const hashParams = new URLSearchParams(url.hash.slice(1)); // Remove leading #
    const dataParam = hashParams.get('data');
    expect(
      dataParam,
      `URL should contain a "data" parameter in hash. Received URL: "${shareableLink}"`
    ).toBeTruthy();

    // Navigate to the shareable link using the hash
    await page.goto(`/#data=${dataParam}`);

    // Wait for app to load
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Verify the app loaded successfully with content
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
});
