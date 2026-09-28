import { test, expect } from '@playwright/test';
import LZString from 'lz-string';

/**
 * Template formulas ({{% ... %}}) are user code. These tests check that a
 * shared link cannot use one to run code in the playground page, and that
 * formulas still work for their intended purpose.
 */

const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const DATA = JSON.stringify({ $class: 'hello@1.0.0.HelloWorld', name: 'Ada' });

/** Builds the same "#data=" link the Share button produces. */
function shareLink(templateMarkdown: string): string {
  const payload = { templateMarkdown, modelCto: MODEL, data: DATA, agreementHtml: '' };
  return `/#data=${LZString.compressToEncodedURIComponent(JSON.stringify(payload))}`;
}

/*
 * The first render in a fresh browser downloads TypeScript's type
 * definitions from the CDN before any formula can compile. That is the
 * same on the main thread, but it is slow, so these tests allow far more
 * than Playwright's default 30 s.
 */
const RENDER_TIMEOUT = 180_000;

test.describe('Template rendering sandbox', () => {
  test.describe.configure({ timeout: 240_000 });

  test('a formula in a shared link cannot reach the page, its storage or the network', async ({ page, baseURL }) => {
    // The formula tries what an attacker would, then reports what it could reach.
    // The network probe targets the playground's own origin, the most tempting destination.
    const target = new URL('/', baseURL).href;
    const probe = [
      'const g = globalThis as any;',
      'try { g.__playgroundPwned = true; } catch (e) {}',
      // Only a worker started from a null-origin document reports "null";
      // a same-origin worker would report the playground's origin.
      'const origin = String(g.origin);',
      'const storage = typeof g.localStorage === "undefined" ? "none" : "reachable";',
      'const dom = g.document && typeof g.document.createElement === "function" ? "reachable" : "none";',
      'let network = "open";',
      'try {',
      '  const xhr = new g.XMLHttpRequest();',
      `  xhr.open("GET", ${JSON.stringify(target)}, false);`,
      '  xhr.send();',
      '} catch (e) { network = "blocked"; }',
      'return "origin=" + origin + " storage=" + storage + " dom=" + dom + " network=" + network;',
    ].join(' ');
    const template = ['Hello {{name}}.', '', `Verdict: {{% ${probe} %}}`].join('\n');

    await page.goto(shareLink(template));

    const preview = page.locator('.main-container-agreement');
    await expect(preview).toContainText('Hello Ada', { timeout: RENDER_TIMEOUT });
    // The engine renders a formula's string result in quotes. The network
    // probe is meaningful because Vite's dev and preview servers send
    // permissive CORS headers, so only the sandbox's CSP can block it.
    await expect(preview).toContainText('Verdict: "origin=null storage=none dom=none network=blocked"');

    // The assignment landed on the worker's global, not the page's.
    const pwned = await page.evaluate(() => (window as unknown as { __playgroundPwned?: boolean }).__playgroundPwned);
    expect(pwned).toBeUndefined();
  });

  test('formulas still compute values in the preview', async ({ page }) => {
    await page.goto(shareLink('{{name}} has {{% return name.length %}} letters.'));
    await expect(page.locator('.main-container-agreement')).toContainText('Ada has 3 letters.', {
      timeout: RENDER_TIMEOUT,
    });
  });

  test('a formula that throws is reported in the Problems panel, not lost', async ({ page }) => {
    await page.goto(shareLink('{{% throw new Error("formula exploded"); %}}'));
    await expect(page.getByText(/formula exploded/).first()).toBeVisible({ timeout: RENDER_TIMEOUT });
  });

  test('a formula cannot take over the worker to fake later previews', async ({ page }) => {
    test.setTimeout(360_000);
    // A document that would render as "FORGED PREVIEW".
    const forged = JSON.stringify({
      $class: 'org.accordproject.commonmark@0.5.0.Document',
      xmlns: 'http://commonmark.org/xml/1.0',
      nodes: [{
        $class: 'org.accordproject.commonmark@0.5.0.Paragraph',
        nodes: [{ $class: 'org.accordproject.commonmark@0.5.0.Text', text: 'FORGED PREVIEW' }],
      }],
    });
    // The formula replaces the worker's message handler so that it answers
    // every later render (and heartbeat) itself.
    const hijack = [
      'const g = globalThis as any;',
      `const forged = ${forged};`,
      'g.onmessage = (e: any) => {',
      '  const d = e.data;',
      '  if (d && d.type === "rebuild-request") { g.postMessage({ type: "rebuild-result", requestId: d.requestId, success: true, ciceroMark: forged }); }',
      '  if (d && d.type === "rebuild-ping") { g.postMessage({ type: "rebuild-pong", pingId: d.pingId }); }',
      '};',
      'return "armed";',
    ].join(' ');
    await page.goto(shareLink(`Status: {{% ${hijack} %}}`));
    const preview = page.locator('.main-container-agreement');
    await expect(preview).toContainText('Status: "armed"', { timeout: RENDER_TIMEOUT });

    // The user moves on to a template of their own.
    await page.locator('.samples-element button').click();
    await page.getByText('Hello World', { exact: true }).click();
    const confirm = page.getByRole('button', { name: 'Continue' });
    if (await confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await confirm.click();

    await expect(preview).toContainText('Hello John Doe!', { timeout: RENDER_TIMEOUT });
    await expect(preview).not.toContainText('FORGED PREVIEW');
  });

  test('a formula that never returns is stopped without freezing the page', async ({ page }) => {
    await page.goto(shareLink('Loop: {{% while (true) {} %}}'));

    await expect(page.getByText(/Rendering stopped responding/).first()).toBeVisible({
      timeout: RENDER_TIMEOUT,
    });

    // The loop ran in the worker, so the page stayed interactive throughout.
    const started = Date.now();
    await page.evaluate(() => document.title);
    expect(Date.now() - started).toBeLessThan(2_000);
    await expect(page.getByRole('button', { name: 'Settings' })).toBeEnabled();
  });
});
