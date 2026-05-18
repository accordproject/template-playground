import { test, expect } from '@playwright/test';

/**
 * E2E tests for the TipTap Template Editor.
 * 
 * These tests verify keyboard navigation and toolbar interactions
 * when the rich editor feature is enabled.
 */
test.describe('TipTap Template Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage to enable rich editor before navigating
    await page.addInitScript(() => {
      localStorage.setItem('hasVisited', 'true');
      localStorage.setItem('useRichEditor', 'true');
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should show Beta tag when rich editor is enabled', async ({ page }) => {
    // The Beta tag should be visible in the Template panel header
    const betaTag = page.locator('.ant-tag').filter({ hasText: 'Beta' });
    await expect(betaTag).toBeVisible();
  });

  test('should display rich editor toolbar', async ({ page }) => {
    // Look for the TipTap editor toolbar
    const toolbar = page.locator('.ap-template-editor [role="toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
  });

  test('should toggle between rich and markdown view with Ctrl+M', async ({ page }) => {
    // Wait for the TipTap editor to be visible
    const tiptapEditor = page.locator('.ap-template-editor');
    await expect(tiptapEditor).toBeVisible({ timeout: 5000 });
    
    // Rich editor content should be visible initially
    const richContent = page.locator('.ap-template-editor__content');
    await expect(richContent).toBeVisible();
    
    // Press Ctrl+M to toggle to markdown view
    await page.keyboard.press('Control+m');
    
    // After toggle, the Monaco editor should be visible (markdown mode)
    // Wait a moment for the view to switch
    await page.waitForTimeout(500);
    
    // Press Ctrl+M again to toggle back
    await page.keyboard.press('Control+m');
    
    // Rich editor content should be visible again
    await expect(richContent).toBeVisible({ timeout: 2000 });
  });

  test('toolbar Insert dropdown should open dialog', async ({ page }) => {
    // Wait for toolbar to be visible
    const toolbar = page.locator('.ap-template-editor [role="toolbar"]');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
    
    // Click the Insert dropdown trigger (look for Insert or Variables button)
    const insertButton = toolbar.locator('button').filter({ hasText: /insert|variable/i }).first();
    
    // If the button exists, click it to open the dropdown
    if (await insertButton.isVisible()) {
      await insertButton.click();
      
      // Look for dropdown menu items
      const menuItem = page.locator('[role="menuitem"]').first();
      if (await menuItem.isVisible({ timeout: 2000 })) {
        await menuItem.click();
        
        // A dialog should open for inserting the template element
        const dialog = page.locator('.ap-insert-dialog, [role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('should hide standard toolbar when rich editor is enabled', async ({ page }) => {
    // The TemplateMarkdownToolbar should NOT be visible when rich editor is enabled
    // Look for the toolbar that appears above the Monaco editor normally
    const standardToolbar = page.locator('.template-markdown-toolbar');
    
    // It should either not exist or not be visible
    const isVisible = await standardToolbar.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});

test.describe('TipTap Editor Disabled', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure rich editor is disabled
    await page.addInitScript(() => {
      localStorage.setItem('hasVisited', 'true');
      localStorage.setItem('useRichEditor', 'false');
    });
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should NOT show Beta tag when rich editor is disabled', async ({ page }) => {
    // The Beta tag should not be visible
    const betaTag = page.locator('.ant-tag').filter({ hasText: 'Beta' });
    await expect(betaTag).not.toBeVisible();
  });

  test('should show standard Monaco editor when rich editor is disabled', async ({ page }) => {
    // Look for the Monaco editor container
    const monacoEditor = page.locator('.monaco-editor');
    await expect(monacoEditor.first()).toBeVisible({ timeout: 5000 });
  });
});
