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
      // Create archive first
      const blob = await createArchive(
        mockData.name,
        mockData.model,
        mockData.template,
        mockData.data
      );

      // Convert blob to File
      const file = new File([blob], 'test.cta', { type: 'application/zip' });

      // Extract and verify
      const extracted = await extractArchive(file);
      expect(extracted.model).toBe(mockData.model);
      expect(extracted.template).toBe(mockData.template);
      expect(extracted.data).toBe(mockData.data);
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
      const file = new File([blob], 'test.cta');
      const result = await extractArchive(file);

      expect(result.model).toBe(mockData.model);
      expect(result.template).toBe(mockData.template);
      expect(result.data).toBe(mockData.data);
    });
  });
});
