import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import useAppStore from '../../store/store';

describe('loadFromArchive store action', () => {
  beforeEach(() => {
    useAppStore.setState({
      sampleName: 'Default',
      templateMarkdown: '',
      modelCto: '',
      data: '{}',
      error: undefined,
      isLogicFeatureEnabled: true,
    });
  });

  it('parses a valid template zip archive and populates store fields', async () => {
    const packageJson = {
      name: 'imported-template',
      version: '1.0.0',
      accordproject: {
        template: 'contract',
        cicero: '^1.0.0',
      },
    };

    const zip = new JSZip();
    zip.file('package.json', JSON.stringify(packageJson));
    zip.file('text/grammar.tem.md', 'Hello {{name}}');
    zip.file('model/model.cto', 'namespace org.example@1.0.0\n@template\nconcept Person {\n  o String name\n}');
    zip.file(
      'text/sample.json',
      JSON.stringify({
        $class: 'org.example@1.0.0.Person',
        name: 'World',
      })
    );
    zip.file('logic/logic.ts', 'export class Logic {}');

    const buffer = await zip.generateAsync({ type: 'uint8array' });

    await useAppStore.getState().loadFromArchive(buffer, 'my-template.cta');

    const state = useAppStore.getState();
    expect(state.sampleName).toBe('Imported Template');
    expect(state.templateMarkdown).toBe('Hello {{name}}');
    expect(state.modelCto).toContain('namespace org.example@1.0.0');
    expect(state.logicTs).toBe('export class Logic {}');
    expect(state.error).toBeUndefined();
  });

  it('handles malformed input buffers and sets store error', async () => {
    const invalidBuffer = new Uint8Array([0, 1, 2, 3, 4, 5]);

    await expect(
      useAppStore.getState().loadFromArchive(invalidBuffer, 'bad-file.cta')
    ).rejects.toThrow();

    const state = useAppStore.getState();
    expect(state.error).toContain('Couldn\'t import "bad-file.cta"');
  });
});
