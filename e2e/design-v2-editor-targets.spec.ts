import { test, expect } from '@playwright/test';

test.use({
  storageState: {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:5173',
        localStorage: [
          { name: 'hasVisited', value: 'true' },
          { name: 'isDesignV2Enabled', value: 'true' },
        ],
      },
    ],
  },
});

test.describe('Design v2 editor targets', () => {
  test('Deploy card provides all three editor options', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.nd-rail')).toBeVisible({
      timeout: 30000,
    });

    // Enter the Design V2 workflow.
    await page.locator('.nd-hero-actions button').first().click();

    // Navigate directly to Deploy using the stepper.
    const stepper = page.locator('.nd-stepper-cards');
    await expect(stepper).toBeVisible();

    await stepper.getByRole('button', { name: /Deploy/ }).click();

    // Verify the editor card and its three external links.
    const card = page.getByRole('article', {
      name: 'Open in an editor',
    });

    await expect(card).toBeVisible();

    const targets = [
      {
        label: 'VS Code for the Web',
        href: 'https://vscode.dev/',
      },
      {
        label: 'Desktop VS Code',
        href: 'https://code.visualstudio.com/download',
      },
      {
        label: 'Claude Code',
        href: 'https://code.claude.com/docs/en/quickstart',
      },
    ];

    for (const target of targets) {
      const link = card.getByRole('link', {
        name: new RegExp(`^${target.label}`),
      });

      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', target.href);
      await expect(link).toHaveAttribute('target', '_blank');
    }
  });
});
