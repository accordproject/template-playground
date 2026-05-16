import { test, expect } from '@playwright/test';

test.describe('Template Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should have sample dropdown in navbar and change templates', async ({ page }) => {
    // Find the sample dropdown button in navbar - it shows current sample name or "Samples"
    const dropdown = page.locator('.samples-element button');
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
    // Find the Data Model collapse button (title includes "Collapse Data Model panel")
    const modelCollapseBtn = page.locator('button[title="Collapse Data Model panel"]');
    await expect(modelCollapseBtn).toBeVisible();

    // Click to collapse
    await modelCollapseBtn.click();

    // Button should now say Expand
    await expect(page.locator('button[title="Expand Data Model panel"]')).toBeVisible();
  });

  test('should toggle Editor panel visibility', async ({ page }) => {
    // Find Editor toggle button in sidebar
    const editorToggle = page.getByRole('button', { name: 'Editor' });
    await expect(editorToggle).toBeVisible();

    // Initially editors should be visible
    await expect(page.getByText('Data Model')).toBeVisible();

    // Toggle off
    await editorToggle.click();

    // Editors should be hidden
    await expect(page.getByText('Data Model')).toBeHidden();

    // Toggle back on
    await editorToggle.click();

    // Editors should be visible again
    await expect(page.getByText('Data Model')).toBeVisible();
  });

  test('should load sample directly without modal when there are no unsaved changes', async ({ page }) => {
    test.slow();

    // Open the navbar Samples dropdown and pick any sample without editing first
    const dropdown = page.locator('.samples-element button');
    await expect(dropdown).toBeVisible({ timeout: 30000 });
    await dropdown.click();

    const helloWorldOption = page.getByText('Hello World', { exact: true });
    await expect(helloWorldOption).toBeVisible({ timeout: 5000 });
    await helloWorldOption.click();

    // No confirmation modal should appear
    await expect(page.locator('.ant-modal-confirm')).toHaveCount(0);

    // Sample should load
    await expect(page.locator('.main-container-agreement')).toContainText(/Hello|hello/i, {
      timeout: 10000,
    });
  });

  test('should show confirmation modal and keep edits when Cancel is clicked', async ({ page }) => {
    test.slow();

    // Make an edit in the Data Model (Concerto) editor to create unsaved changes
    const concertoEditor = page.locator('.monaco-editor').first();
    await expect(concertoEditor).toBeVisible({ timeout: 30000 });
    await concertoEditor.click();
    await page.keyboard.type(' ');

    // Try to load a different sample via the navbar dropdown
    const dropdown = page.locator('.samples-element button');
    await expect(dropdown).toBeVisible({ timeout: 30000 });
    await dropdown.click();
    const helloWorldOption = page.getByText('Hello World', { exact: true });
    await expect(helloWorldOption).toBeVisible({ timeout: 5000 });
    await helloWorldOption.click();

    // Confirmation modal should appear
    const confirmModal = page.locator('.ant-modal-confirm');
    await expect(confirmModal).toBeVisible({ timeout: 5000 });
    await expect(confirmModal.getByText('Load Sample Template')).toBeVisible();
    await expect(
      confirmModal.getByText(/Loading a new sample will replace your current/i)
    ).toBeVisible();

    // Click Cancel
    await confirmModal.getByRole('button', { name: 'Cancel' }).click();

    // Modal should close and the agreement preview should not have switched
    // to the Hello World sample (i.e. the cancelled sample never loaded)
    await expect(confirmModal).toBeHidden({ timeout: 3000 });
    await expect(page.locator('.main-container-agreement')).not.toContainText('Hello World');
  });

  test('should load the new sample when Continue is clicked from the modal', async ({ page }) => {
    test.slow();

    // Make an edit in the Data Model (Concerto) editor to create unsaved changes
    const concertoEditor = page.locator('.monaco-editor').first();
    await expect(concertoEditor).toBeVisible({ timeout: 30000 });
    await concertoEditor.click();
    await page.keyboard.type(' ');

    // Try to load a different sample via the navbar dropdown
    const dropdown = page.locator('.samples-element button');
    await expect(dropdown).toBeVisible({ timeout: 30000 });
    await dropdown.click();
    const helloWorldOption = page.getByText('Hello World', { exact: true });
    await expect(helloWorldOption).toBeVisible({ timeout: 5000 });
    await helloWorldOption.click();

    // Confirmation modal should appear
    const confirmModal = page.locator('.ant-modal-confirm');
    await expect(confirmModal).toBeVisible({ timeout: 5000 });

    // Click Continue
    await confirmModal.getByRole('button', { name: 'Continue' }).click();

    // Modal should close and the new sample should load
    await expect(confirmModal).toBeHidden({ timeout: 5000 });
    await expect(page.locator('.main-container-agreement')).toContainText(/Hello|hello/i, {
      timeout: 10000,
    });
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
    const dataModelHeader = page.getByText('Data Model');
    
    // If editors are not visible, click to show them first
    if (!(await dataModelHeader.isVisible())) {
      await editorToggle.click();
      await expect(dataModelHeader).toBeVisible();
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
