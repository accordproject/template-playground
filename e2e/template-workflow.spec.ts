import { test, expect } from '@playwright/test';

test.describe('Template Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should have sample dropdown and change templates', async ({ page }) => {
    // Find the sample dropdown button
    const dropdown = page.getByRole('button', { name: 'Load sample dropdown' });
    await expect(dropdown).toBeVisible();

    // Click to open dropdown
    await dropdown.click();

    // Wait for dropdown options to appear
    const helloWorldOption = page.getByText('Hello World', { exact: true });
    await expect(helloWorldOption).toBeVisible({ timeout: 5000 });

    // Select Hello World sample
    await helloWorldOption.click();

    // Verify the template content changed - should contain Hello World related content
    await expect(page.locator('.main-container-agreement')).toContainText(/Hello|hello/i, {
      timeout: 10000,
    });
  });

  test('should collapse and expand editor panels', async ({ page }) => {
    // Find the Concerto Model collapse button
    const modelCollapseBtn = page.locator('button[title="Collapse"]').first();
    await expect(modelCollapseBtn).toBeVisible();

    // Click to collapse
    await modelCollapseBtn.click();

    // Button should now say Expand
    await expect(page.locator('button[title="Expand"]').first()).toBeVisible();
  });

  test('should toggle Editor panel visibility', async ({ page }) => {
    // Find Editor toggle button in sidebar
    const editorToggle = page.getByRole('button', { name: 'Editor' });
    await expect(editorToggle).toBeVisible();

    // Initially editors should be visible
    await expect(page.getByText('Concerto Model')).toBeVisible();

    // Toggle off
    await editorToggle.click();

    // Editors should be hidden
    await expect(page.getByText('Concerto Model')).toBeHidden();

    // Toggle back on
    await editorToggle.click();

    // Editors should be visible again
    await expect(page.getByText('Concerto Model')).toBeVisible();
  });

  test('should toggle Preview panel visibility', async ({ page }) => {
    // Find Preview toggle button in sidebar
    const previewToggle = page.getByRole('button', { name: 'Preview' });
    await expect(previewToggle).toBeVisible();

    // Initially preview should be visible
    const previewPanel = page.locator('.tour-preview-panel');
    await expect(previewPanel).toBeVisible();

    // Ensure at least one editor panel is visible before hiding preview
    // (app forbids hiding the last visible panel)
    const editorToggle = page.getByRole('button', { name: 'Editor' });
    const concertoModelHeader = page.getByText('Concerto Model');
    
    // If editors are not visible, click to show them first
    if (!(await concertoModelHeader.isVisible())) {
      await editorToggle.click();
      await expect(concertoModelHeader).toBeVisible();
    }

    // Now toggle preview off
    await previewToggle.click();

    // Preview should be hidden
    await expect(previewPanel).toBeHidden();

    // Toggle back on
    await previewToggle.click();

    // Preview should be visible again
    await expect(previewPanel).toBeVisible();
  });
});
