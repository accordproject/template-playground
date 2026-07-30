import { describe, it, expect } from 'vitest';
import { generateText, generateHtml } from '../../utils/exportUtils';

describe('exportUtils', () => {
  const mockMarkdown = '# Test Agreement\n\nThis is a **bold** statement.';
  const mockHtml = '<h1>Test Agreement</h1><p>This is a <strong>bold</strong> statement.</p><script>alert("hack");</script>';

  describe('generateText', () => {
    it('should correctly convert Markdown to plain text', async () => {
      const result = await generateText(mockMarkdown);
      
      expect(result).toContain('Test Agreement');
      expect(result).toContain('This is a bold statement.');
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
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
