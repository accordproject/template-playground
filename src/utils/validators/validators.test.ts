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

  it('rejects a model that imports an unbundled external namespace', async () => {
    const modelWithExternalImport = `namespace example@1.0.0

import com.example.foo@1.0.0.Bar from https://example.com/foo.cto

asset TemplateModel identified by id {
  o String id
}`;
    const data = JSON.stringify({
      $class: 'example@1.0.0.TemplateModel',
      id: '00000000-0000-0000-0000-000000000000',
    });
    // The fast path runs offline; with the bundle preloaded, an unbundled
    // namespace surfaces here as an "Invalid CTO model" error that names the
    // missing namespace rather than slipping through to the full rebuild.
    await expect(
      validateBeforeRebuild(validTemplate, modelWithExternalImport, data)
    ).rejects.toThrow(/Invalid CTO model.*com\.example\.foo@1\.0\.0/);
  });

  it('accepts a model that imports a bundled Accord Project namespace', async () => {
    const modelWithBundledImport = `namespace example@1.0.0

import org.accordproject.contract@0.2.0.{Clause} from https://models.accordproject.org/accordproject/contract@0.2.0.cto

@template
asset TemplateModel extends Clause {
  o String greeting
}`;
    const data = JSON.stringify({
      $class: 'example@1.0.0.TemplateModel',
      greeting: 'hello',
      clauseId: '00000000-0000-0000-0000-000000000000',
    });
    await expect(
      validateBeforeRebuild(validTemplate, modelWithBundledImport, data)
    ).resolves.not.toThrow();
  });
});
