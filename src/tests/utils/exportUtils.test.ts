import { describe, it, expect } from 'vitest';
import { generateMarkdown, generateHtml } from '../../utils/exportUtils';

describe('exportUtils', () => {
  const mockHtml = '<h1>Test Agreement</h1><p>This is a <strong>bold</strong> statement.</p><script>alert("hack");</script>';

  describe('generateMarkdown', () => {
    it('should correctly convert HTML to Markdown', async () => {
      const result = await generateMarkdown(mockHtml);
      
      // Expected markdown output based on markdown-transform
      expect(result).toContain('Test Agreement\n====');
      expect(result).toContain('This is a **bold** statement.');
      
      // Ensure the tag itself is stripped
      expect(result).not.toContain('<script>');
    });
  });

  describe('generateHtml', () => {
    it('should sanitize the HTML and wrap it in a valid document', () => {
      const result = generateHtml(mockHtml);

      // Verify the wrapper exists
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>Agreement</title>');
      
      // Verify the content is present
      expect(result).toContain('<h1>Test Agreement</h1>');
      expect(result).toContain('<p>This is a <strong>bold</strong> statement.</p>');

      // Verify malicious scripts are stripped
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("hack")');
    });
  });
});
