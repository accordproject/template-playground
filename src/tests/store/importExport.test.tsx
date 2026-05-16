import { vi, describe, it, expect, beforeEach } from 'vitest';
import useAppStore from '../../store/store';

vi.mock('../../utils/archive/archive', () => ({
  createArchive: vi.fn(),
  extractArchive: vi.fn(),
  downloadBlob: vi.fn(),
}));

import { createArchive, extractArchive, downloadBlob } from '../../utils/archive/archive';

describe('useAppStore - import/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportTemplate', () => {
    it('should create archive and trigger download', async () => {
      const mockBlob = new Blob(['test']);
      vi.mocked(createArchive).mockResolvedValue(mockBlob);

      useAppStore.setState({
        sampleName: 'Test',
        modelCto: 'model',
        templateMarkdown: 'template',
        data: '{}',
      });

      await useAppStore.getState().exportTemplate();

      expect(createArchive).toHaveBeenCalledWith('Test', 'model', 'template', '{}');
      expect(downloadBlob).toHaveBeenCalledWith(mockBlob, 'test.cta');
    });

    it('should set error on failure', async () => {
      vi.mocked(createArchive).mockRejectedValue(new Error('zip failed'));

      await useAppStore.getState().exportTemplate();

      const state = useAppStore.getState();
      expect(state.error).toContain('Failed to export template');
      expect(state.isProblemPanelVisible).toBe(true);
    });
  });

  describe('importTemplate', () => {
    it('should extract archive and update store state', async () => {
      vi.mocked(extractArchive).mockResolvedValue({
        name: 'Imported',
        model: 'new model',
        template: 'new template',
        data: '{"key":"value"}',
      });

      const file = new File(['fake'], 'test.cta');
      await useAppStore.getState().importTemplate(file);

      const state = useAppStore.getState();
      expect(state.sampleName).toBe('Imported');
      expect(state.modelCto).toBe('new model');
      expect(state.templateMarkdown).toBe('new template');
      expect(state.data).toBe('{"key":"value"}');
    });

    it('should set error on failure', async () => {
      vi.mocked(extractArchive).mockRejectedValue(new Error('invalid cta'));

      const file = new File(['bad'], 'bad.cta');
      await expect(useAppStore.getState().importTemplate(file)).rejects.toThrow('invalid cta');

      const state = useAppStore.getState();
      expect(state.error).toContain('Failed to import template');
      expect(state.isProblemPanelVisible).toBe(true);
    });
  });
});
