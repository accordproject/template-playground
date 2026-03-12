import { describe, it, expect } from 'vitest';
import { createArchive, extractArchive } from '../../utils/archive/archive';

describe('Archive Utilities', () => {
  const mockData = {
    name: 'Test Template',
    model: 'namespace test@1.0.0\nconcept Data { o String value }',
    template: '# Hello {{value}}',
    data: JSON.stringify({ $class: 'test@1.0.0.Data', value: 'World' }),
  };

  describe('createArchive', () => {
    it('should create a valid ZIP blob', async () => {
      const blob = await createArchive(
        mockData.name,
        mockData.model,
        mockData.template,
        mockData.data
      );
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('extractArchive', () => {
    it('should extract template data from archive', async () => {
      const blob = await createArchive(
        mockData.name,
        mockData.model,
        mockData.template,
        mockData.data
      );
      const file = new File([blob], 'test.cta', { type: 'application/zip' });
      const extracted = await extractArchive(file);

      expect(extracted.model).toBe(mockData.model);
      expect(extracted.template).toBe(mockData.template);
      expect(extracted.data).toBe(mockData.data);
    });

    it('should extract human-readable name from description field', async () => {
      const blob = await createArchive(
        mockData.name,
        mockData.model,
        mockData.template,
        mockData.data
      );
      const file = new File([blob], 'test.cta');
      const extracted = await extractArchive(file);
      expect(extracted.name).toBe('Test Template');
    });
  });

  describe('round-trip', () => {
    it('should preserve data through export/import cycle', async () => {
      const blob = await createArchive(
        mockData.name,
        mockData.model,
        mockData.template,
        mockData.data
      );
      const file = new File([blob], 'roundtrip.cta');
      const result = await extractArchive(file);

      expect(result.name).toBe(mockData.name);
      expect(result.model).toBe(mockData.model);
      expect(result.template).toBe(mockData.template);
      expect(result.data).toBe(mockData.data);
    });
  });
  describe('error handling', () => {
    it('should throw when archive is missing model file', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('package.json', '{"name":"test"}');
      zip.file('text/grammar.tem.md', 'template');
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'bad.cta');

      await expect(extractArchive(file)).rejects.toThrow('Archive missing model .cto file');
    });

    it('should throw when archive is missing grammar file', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('package.json', '{"name":"test"}');
      zip.file('model/model.cto', 'namespace test');
      const blob = await zip.generateAsync({ type: 'blob' });
      const file = new File([blob], 'bad.cta');

      await expect(extractArchive(file)).rejects.toThrow('Archive missing text/grammar.tem.md');
    });
  });
});
