import { test, expect } from '@playwright/test';

/**
 * Design v2 is the default layout (#1116). The other specs pin the classic
 * layout through playwright.config.ts; these start with empty storage, as a
 * first-time visitor would.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const banner = (page: import('@playwright/test').Page) =>
  page.getByRole('region', { name: 'About the new design' });

test.describe('Design v2 as the default', () => {
  test('a first visit shows the one-time banner after leaving welcome', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.nd-rail')).toBeVisible({ timeout: 30_000 });
    await expect(banner(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Start building →' }).click();
    await expect(banner(page)).toBeVisible();

    // Shown once: a reload keeps design v2 without the banner, even though it was never clicked.
    await page.reload();
    await expect(page.locator('.nd-rail')).toBeVisible({ timeout: 30_000 });
    await expect(banner(page)).toHaveCount(0);
  });

  test('"Switch to classic" opts out immediately and after a reload', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Start building →' }).click();
    await banner(page).getByRole('button', { name: 'Switch to classic' }).click();

    await expect(page.locator('.nd-rail')).toHaveCount(0);
    await expect(page.locator('.main-container')).toBeVisible();

    await page.reload();
    await expect(page.locator('.nd-rail')).toHaveCount(0);
    await expect(page.locator('.main-container')).toBeVisible();
  });
});
