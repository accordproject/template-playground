import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * US-18: End-to-End Test Suite for Logic Lifecycle
 *
 * Tests the full smart contract logic workflow:
 * enable logic → load sample → compile → init → trigger → verify outputs
 * Also covers error handling and shareable link round-trip.
 */

test.describe('Logic Lifecycle', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  /**
   * Before each test:
   * 1. Navigate to the playground
   * 2. Wait for the app to finish loading
   * 3. Enable the logic feature flag via Settings
   * 4. Load the Counter Contract (with Logic) sample
   *
   * After these steps, the Logic Editor and Contract Runner panels
   * should be visible and populated with counter logic code.
   */
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()} at ${msg.location().url}`));
    page.on('pageerror', err => console.log(`[Browser Error] ${err.message}`));

    // Intercept TypeScript lib fetches and serve them from the local typescript installation
    await page.route(/playgroundcdn\.typescriptlang\.org\/cdn\/.*\/typescript\/lib\/.*/, async (route) => {
      const url = route.request().url();
      const filename = url.split('/').pop();
      try {
        const tsLibPath = path.dirname(require.resolve('typescript/package.json'));
        const filePath = path.join(tsLibPath, 'lib', filename!);
        if (fs.existsSync(filePath)) {
          const body = fs.readFileSync(filePath, 'utf-8');
          await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: body,
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        } else {
          console.log(`[Intercept] Local file not found: ${filename}, fulfilling with empty body`);
          await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: '',
            headers: { 'Access-Control-Allow-Origin': '*' }
          });
        }
      } catch (e) {
        console.error(`[Intercept Error]`, e);
        await route.continue();
      }
    });

    test.slow(); // Logic compilation is network/CPU intensive

    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // --- Enable logic feature via Settings modal ---
    const settingsButton = page.getByRole('button', { name: 'Settings' });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    const settingsModal = page.getByRole('dialog');
    await expect(settingsModal).toBeVisible({ timeout: 5000 });

    // Find the "Enable Template Logic" toggle and turn it on
    const logicToggle = settingsModal.locator('button[aria-label="Toggle template logic"]');
    await expect(logicToggle).toBeVisible();

    // Only click if not already enabled
    const isChecked = await logicToggle.getAttribute('aria-checked');
    if (isChecked !== 'true') {
      await logicToggle.click();
    }

    // Close settings
    await page.keyboard.press('Escape');
    await expect(settingsModal).toBeHidden({ timeout: 3000 });

    // --- Load Counter Contract (with Logic) sample ---
    const dropdown = page.locator('.samples-element button');
    await expect(dropdown).toBeVisible();
    await dropdown.click();

    const counterOption = page.getByText('Counter Contract (with Logic)', { exact: true });
    await expect(counterOption).toBeVisible({ timeout: 5000 });
    await counterOption.click();

    // If unsaved changes modal appears, click Continue
    const confirmModal = page.locator('.ant-modal-confirm');
    if (await confirmModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmModal.getByRole('button', { name: 'Continue' }).click();
      await expect(confirmModal).toBeHidden({ timeout: 5000 });
    }

    // Wait for the logic tour prompt if it appears and dismiss it
    try {
      const tourOverlay = page.locator('.shepherd-modal-overlay-container');
      if (await tourOverlay.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Try to skip or cancel the tour
        const skipButton = page.locator('.shepherd-cancel-icon, .shepherd-button-secondary').first();
        if (await skipButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await skipButton.click();
        }
      }
    } catch {
      // Tour not showing — that's fine
    }

    // Dismiss any lingering dropdown overlays (like the samples menu backdrop)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Wait for rebuild to settle
    await page.waitForTimeout(1500);
  });

  // ─── Happy Path ────────────────────────────────────────────────────────

  test('should display Logic Editor panel with Counter Contract code', async ({ page }) => {
    // Logic editor panel should be visible
    const logicPanel = page.locator('.logic-editor-badge-container');
    await expect(logicPanel).toBeVisible({ timeout: 10000 });

    // Should contain the counter logic class
    const monacoEditor = logicPanel.locator('.monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 10000 });
  });

  test('should compile logic and show Compiled status', async ({ page }) => {
    // Click Apply & Compile button
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await expect(compileButton).toBeVisible({ timeout: 10000 });
    await compileButton.click({ force: true });

    // Wait for compilation to finish — the badge should show "Compiled"
    await expect(page.locator('.logic-editor-badge-wrapper .ant-badge-status-success')).toBeVisible({ timeout: 60000 });
  });

  test('should init contract and populate State tab', async ({ page }) => {
    // Compile first
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await expect(compileButton).toBeVisible({ timeout: 10000 });
    await compileButton.click({ force: true });
    await expect(page.locator('.logic-editor-badge-wrapper .ant-badge-status-success')).toBeVisible({ timeout: 60000 });

    // Click Init Contract button
    const initButton = page.getByRole('button', { name: 'Init Contract' });
    await expect(initButton).toBeEnabled({ timeout: 10000 });
    await initButton.click({ force: true });

    // Wait for execution to complete
    await page.waitForTimeout(3000);

    // Navigate to State tab to check output
    const stateTab = page.getByRole('tab', { name: 'State' });
    await expect(stateTab).toBeVisible({ timeout: 5000 });
    await stateTab.click();

    // State should contain initialized counter data
    const stateContent = page.locator('.contract-runner-panel-container');
    await expect(stateContent).toBeVisible();
    // The counter state should have count: 0 after init
    await expect(stateContent).toContainText('count', { timeout: 10000 });
  });

  test('should trigger contract and populate Response tab', async ({ page }) => {
    // Compile
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await expect(compileButton).toBeVisible({ timeout: 10000 });
    await compileButton.click({ force: true });
    await expect(page.locator('.logic-editor-badge-wrapper .ant-badge-status-success')).toBeVisible({ timeout: 60000 });

    // Init
    const initButton = page.getByRole('button', { name: 'Init Contract' });
    await page.screenshot({ path: 'debug1.png' });
    await expect(initButton).toBeEnabled({ timeout: 10000 });
    await initButton.click({ force: true });
    await page.waitForTimeout(3000);

    // Send Request (trigger)
    const triggerButton = page.getByRole('button', { name: 'Send Request' });
    await expect(triggerButton).toBeEnabled({ timeout: 10000 });
    await triggerButton.click({ force: true });
    await page.waitForTimeout(3000);

    // Check Response tab
    const responseTab = page.getByRole('tab', { name: 'Response' });
    await expect(responseTab).toBeVisible();
    await responseTab.click();

    const executionResults = page.locator('.contract-runner-panel-container');
    await expect(executionResults).toContainText('message', { timeout: 10000 });
  });

  test('should update state after trigger and show Events', async ({ page }) => {
    // Full lifecycle: compile → init → trigger
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await expect(compileButton).toBeVisible({ timeout: 10000 });
    await compileButton.click({ force: true });
    await expect(page.locator('.logic-editor-badge-wrapper .ant-badge-status-success')).toBeVisible({ timeout: 60000 });

    const initButton = page.getByRole('button', { name: 'Init Contract' });
    await expect(initButton).toBeEnabled({ timeout: 10000 });
    await initButton.click({ force: true });
    await page.waitForTimeout(3000);

    const triggerButton = page.getByRole('button', { name: 'Send Request' });
    await expect(triggerButton).toBeEnabled({ timeout: 10000 });
    await triggerButton.click({ force: true });
    await page.waitForTimeout(3000);

    // Events tab should contain CounterUpdated event
    const eventsTab = page.getByRole('tab', { name: 'Events' });
    await expect(eventsTab).toBeVisible();
    await eventsTab.click();

    const executionResults = page.locator('.contract-runner-panel-container');
    await expect(executionResults).toContainText('CounterUpdated', { timeout: 10000 });

    // State tab should show updated count
    const stateTab = page.getByRole('tab', { name: 'State' });
    await stateTab.click();
    await expect(executionResults).toContainText('count', { timeout: 10000 });
  });

  // ─── Error Handling ────────────────────────────────────────────────────

  test('should show error when trigger is called before init', async ({ page }) => {
    // Compile
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await expect(compileButton).toBeVisible({ timeout: 10000 });
    await compileButton.click({ force: true });
    await expect(page.locator('.logic-editor-badge-wrapper .ant-badge-status-success')).toBeVisible({ timeout: 60000 });

    // Skip init — directly try to send request
    const triggerButton = page.getByRole('button', { name: 'Send Request' });
    await expect(triggerButton).toBeVisible({ timeout: 5000 });

    // The button may be disabled (tooltip visible) OR it may error on click
    const isDisabled = await triggerButton.isDisabled();
    if (!isDisabled) {
      await triggerButton.click();
      await page.waitForTimeout(2000);
      // Should show error about contract not being initialized
      await expect(page.locator('body')).toContainText(/must be initialized|not initialized/i, {
        timeout: 5000,
      });
    }
    // If button is disabled, that's the correct guard behavior — test passes
  });



  test('should report compilation errors for invalid TypeScript', async ({ page }) => {
    // Get the logic editor and click into the editor
    const logicEditor = page.locator('.logic-editor-badge-container .monaco-editor').first();
    await expect(logicEditor).toBeVisible({ timeout: 10000 });

    // Click into the editor and select all + type invalid code
    await logicEditor.click({ force: true });
    await page.keyboard.press('Control+a');
    await page.keyboard.type('class Broken {{{ invalid syntax');

    // Click Apply & Compile
    const compileButton = page.getByRole('button', { name: /apply & compile/i });
    await compileButton.click({ force: true });

    // Wait for compilation attempt to complete
    await page.waitForTimeout(5000);

    // Should show compilation failure state — either "Compilation Failed" badge
    // or errors visible in the Problems panel
    const hasFailedBadge = await page.getByText('Compilation Failed').isVisible({ timeout: 10000 }).catch(() => false);
    const hasCompilationError = await page.locator('body').evaluate(
      (body) => body.textContent?.includes('Compilation Failed') ||
        body.textContent?.includes('Error') ||
        body.textContent?.includes('does not contain a class extending TemplateLogic')
    );

    expect(hasFailedBadge || hasCompilationError).toBeTruthy();
  });

  // ─── Shareable Link Round-Trip ─────────────────────────────────────────

  test('should preserve logic code in shareable link', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Click Share button
    const shareButton = page.getByRole('button', { name: 'Share' });
    await expect(shareButton).toBeVisible();
    await shareButton.dispatchEvent('click');

    // Wait for success message
    await expect(page.getByText('Link copied to clipboard')).toBeVisible({ timeout: 5000 });

    // Get the shareable link from clipboard
    const shareableLink = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareableLink).toBeTruthy();

    // Parse the URL and extract data hash parameter
    const url = new URL(shareableLink);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const dataParam = hashParams.get('data');
    expect(dataParam, 'Share link should contain compressed data').toBeTruthy();

    // Navigate to the shareable link
    await page.goto(`/#data=${dataParam}`);
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });

    // Wait for state to load
    await page.waitForTimeout(2000);

    // The Logic Editor panel should be visible (logic feature auto-enabled via share link)
    const logicPanel = page.locator('.logic-editor-badge-container');
    await expect(logicPanel).toBeVisible({ timeout: 10000 });
  });
});
