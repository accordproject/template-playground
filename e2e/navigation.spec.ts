import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to Learn page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Find and click the Learn button
    const learnButton = page.locator('.learnNow-button');
    await expect(learnButton).toBeVisible();
    await learnButton.click();

    // Should navigate to learn page
    await expect(page).toHaveURL(/\/learn\/intro/);

    // Learn page content should be visible
    await expect(page.locator('body')).toContainText(/learn|intro|template/i);
  });

  test('should navigate back to playground from Learn page', async ({ page }) => {
    await page.goto('/learn/intro');

    // Wait for any loading to complete
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Click the logo/home link to go back
    const homeLink = page.getByRole('link', { name: 'Template Playground' }).first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    // Should be back at the playground
   await expect(page).toHaveURL(/\/$/);
  });

  test('should have Help dropdown menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Find Help button (visible on desktop)
    const helpButton = page.getByRole('button', { name: /Help/i });
    
    // Skip test if Help button not visible (mobile view)
    if (await helpButton.isVisible()) {
      await helpButton.click();

      // Dropdown should appear with menu items
      await expect(page.getByText('About')).toBeVisible();
      await expect(page.getByText('Community')).toBeVisible();
      await expect(page.getByRole('link', { name: /Documentation/i })).toBeVisible();
    }
  });

  test('should have external links in navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // GitHub link should be present
    const githubLink = page.getByRole('link', { name: /Github/i });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/accordproject/template-playground');

    // Discord link should be present
    const discordLink = page.getByRole('link', { name: /Discord/i });
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('href', 'https://discord.com/invite/Zm99SKhhtA');
  });
});
