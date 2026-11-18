import { describe, it, expect } from 'vitest';
import { convertCiceroMark } from '../../store/store';
import { generateCiceroMark } from '../../sandbox/rebuildPipeline';
import * as lease from '../../samples/residentialLease';

/*
 * The Markdown export: a rendered agreement (CiceroMark, as the rendering
 * sandbox returns it) converted to plain Markdown, with the values filled in
 * and the formatting kept, but none of TemplateMark's markup.
 */
describe('convertCiceroMark', () => {
  it('turns a rendered agreement into plain Markdown', async () => {
    const ciceroMark = await generateCiceroMark(lease.TEMPLATE, lease.MODEL, JSON.stringify(lease.DATA));
    const markdown = await convertCiceroMark(ciceroMark, 'markdown');

    expect(markdown).toContain('Residential Lease Agreement');
    expect(markdown).toContain('**Maria Popescu**');
    // A formula's result, without the quotes CiceroMark keeps around it.
    expect(markdown).toContain('**2,500.00**');
    // No clause blocks or formulas: only the text a signer reads.
    expect(markdown).not.toMatch(/\{\{/);
  }, 60_000);

  it('turns it into plain text with markdown-transform\'s plaintext target, for copying', async () => {
    const ciceroMark = await generateCiceroMark(lease.TEMPLATE, lease.MODEL, JSON.stringify(lease.DATA));
    const text = await convertCiceroMark(ciceroMark, 'text');
    expect(text).toContain('between Harbour View Properties Ltd (the "Landlord") and Maria Popescu');
    expect(text).toContain('that is 2,500.00.');
    expect(text).not.toMatch(/\*\*|\{\{/);
  }, 60_000);

  it('still renders HTML for the preview', async () => {
    const ciceroMark = await generateCiceroMark(lease.TEMPLATE, lease.MODEL, JSON.stringify(lease.DATA));
    expect(await convertCiceroMark(ciceroMark, 'html')).toMatch(/<h1[^>]*>Residential Lease Agreement<\/h1>/);
  }, 60_000);
});
