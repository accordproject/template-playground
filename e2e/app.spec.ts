import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('should load the app and display main components', async ({ page }) => {
    await page.goto('/');

    // Wait for loading to complete
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Navbar should be visible with logo
    await expect(page.getByRole('img', { name: 'Template Playground' })).toBeVisible();

    // Sidebar should be visible with navigation buttons
    await expect(
  page.getByRole('button', { name: 'Editor' }),
  'Editor button should be visible in sidebar'
).toBeVisible();

    await expect(
  page.getByRole('button', { name: 'Preview' }),
  'Preview button should be visible in sidebar'
).toBeVisible();

    await expect(
  page.getByRole('button', { name: 'Problems' }),
  'Problems button should be visible in sidebar'
).toBeVisible();
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
  test('should toggle dark mode via Settings modal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Get initial theme
    const initialTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );

    // Open Settings modal - the gear icon button in sidebar
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Wait for the Settings modal to appear
    const settingsModal = page.getByRole('dialog');
    await expect(settingsModal).toBeVisible({ timeout: 5000 });

    // Find and click the Dark Mode toggle inside the modal
    // The react-dark-mode-toggle library renders a button element
    // Find the section containing "Dark Mode" text, then locate the button within it
    const darkModeSection = settingsModal.locator('div').filter({ hasText: /^Dark Mode/ }).first();
    const darkModeToggle = darkModeSection.locator('button').first();
    await expect(darkModeToggle, 'Dark mode toggle should be visible in Settings modal').toBeVisible();
    await darkModeToggle.click();

    // Close the modal
    const closeButton = settingsModal.getByRole('button', { name: /close/i }).or(
      settingsModal.locator('[aria-label="Close"]')
    );
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Press Escape to close modal
      await page.keyboard.press('Escape');
    }

    // Wait for modal to close
    await expect(settingsModal).toBeHidden({ timeout: 3000 });

    // Theme should change
    const newTheme = await page.evaluate(() => 
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).not.toBe(initialTheme);
  });
});
