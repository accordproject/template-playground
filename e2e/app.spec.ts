import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the app and display main components', async ({ page }) => {
    await page.goto('/');

    // Wait for loading to complete
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Navbar should be visible with logo
    await expect(page.getByRole('img', { name: 'Accord Project' })).toBeVisible();

    // Sidebar should be visible with navigation buttons
    await expect(page.getByRole('button', { name: 'Editor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Problems' })).toBeVisible();
  });

  test('should display editor panels', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Check for editor panel headers
    await expect(page.getByText('Concerto Model')).toBeVisible();
    await expect(page.getByText('TemplateMark')).toBeVisible();
    await expect(page.getByText('JSON Data')).toBeVisible();
  });

  test('should display Preview panel with content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Preview header should be visible
    await expect(page.getByText('Preview').first()).toBeVisible();

    // Download PDF button should be present
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();

    // Preview content area should have rendered HTML
    const previewContent = page.locator('.main-container-agreement');
    await expect(previewContent).toBeVisible();
  });
});

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );

    // Find the dark mode toggle - assert it exists
    const darkModeToggle = page.locator('[data-testid="toggle-dark-mode"]');
    await expect(darkModeToggle, 'Dark mode toggle should be visible').toBeVisible();

    // Click the toggle
    await darkModeToggle.click();

    // Theme should change
    const newTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).not.toBe(initialTheme);
  });
});
