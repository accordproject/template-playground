import { describe, it, expect } from 'vitest';
import { validateBeforeRebuild } from './index';

describe('validateBeforeRebuild', () => {
  const validTemplate = `# Hello World
{{name}}`;

  const validModel = `namespace test@1.0.0

@template
concept Person {
  o String name
}`;

  const validData = JSON.stringify({ $class: 'test@1.0.0.Person', name: 'John' });

  it('should pass validation with valid inputs', async () => {
    await expect(
      validateBeforeRebuild(validTemplate, validModel, validData)
    ).resolves.not.toThrow();
  });

  it('should throw error for invalid JSON', async () => {
    await expect(
      validateBeforeRebuild(validTemplate, validModel, '{invalid json}')
    ).rejects.toThrow('Invalid JSON data');
  });

  it('should throw error for invalid CTO model', async () => {
    const invalidModel = 'namespace invalid syntax here';
    await expect(
      validateBeforeRebuild(validTemplate, invalidModel, validData)
    ).rejects.toThrow('Invalid CTO model');
  });

  // Note: Template validation is skipped in the fast validation
  // because it requires external models to be loaded
});
