import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  DEFAULT_TEMPLATE_NAME,
  buildTemplateArchive,
  buildTemplateArchiveBlob,
  templateSlug,
} from '../../utils/templateArchive';
import { BUNDLED_MODELS } from '../../utils/modelCache';

/** jsdom's Blob has no arrayBuffer(); FileReader reads it. */
const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const sources = { templateMarkdown: 'Hello {{name}}', modelCto: 'namespace org.example@1.0.0', logicTs: 'class L {}' };

describe('templateSlug', () => {
  it('turns a sample name into a package name', () => {
    expect(templateSlug('Late Payment Penalty (with Logic)')).toBe('late-payment-penalty-with-logic');
    expect(templateSlug('New (Blank)')).toBe('new-blank');
  });

  it('falls back to the default name when nothing usable is left', () => {
    expect(templateSlug('')).toBe(DEFAULT_TEMPLATE_NAME);
    expect(templateSlug('(!)')).toBe(DEFAULT_TEMPLATE_NAME);
  });
});

describe('buildTemplateArchive', () => {
  it('packs package.json, text, model, the bundled models and logic', async () => {
    const zip = await JSZip.loadAsync(await buildTemplateArchive(sources, 'my-template'));

    const pkg = JSON.parse(await zip.file('package.json')!.async('string')) as { name: string; accordproject: unknown };
    expect(pkg.name).toBe('my-template');
    expect(pkg.accordproject).toEqual({ template: 'contract', cicero: '^2.1.1' });
    expect(await zip.file('text/grammar.tem.md')!.async('string')).toBe(sources.templateMarkdown);
    expect(await zip.file('model/model.cto')!.async('string')).toBe(sources.modelCto);
    expect(await zip.file('logic/logic.ts')!.async('string')).toBe(sources.logicTs);
    for (const model of BUNDLED_MODELS) {
      expect(zip.file(`model/${model.fileName}`)).not.toBeNull();
    }
  });

  it('leaves logic out of a template without logic', async () => {
    const zip = await JSZip.loadAsync(await buildTemplateArchive({ ...sources, logicTs: '' }));
    expect(zip.file('logic/logic.ts')).toBeNull();
  });

  it('builds the same archive as a zip Blob', async () => {
    const blob = await buildTemplateArchiveBlob(sources);
    expect(blob.type).toBe('application/zip');
    const zip = await JSZip.loadAsync(await readBlob(blob));
    expect(await zip.file('model/model.cto')!.async('string')).toBe(sources.modelCto);
  });
});
