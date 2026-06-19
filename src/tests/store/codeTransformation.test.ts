import { describe, it, expect } from 'vitest';

/**
 * Tests for the regex-based code transformation that prepares compiled
 * TypeScript output for evaluation via `new Function()` inside the sandbox.
 *
 * The transformation:
 *   1. Strips `export class` → `class`
 *   2. Strips `export default` → ``
 *   3. Appends `return ClassName;` if a class extends TemplateLogic
 *   4. Reports an error if no such class is found
 */

function transformCode(code: string): { code: string } | { error: string } {
  // Strip export keywords
  code = code.replace(/export\s+class/g, 'class');
  code = code.replace(/export\s+default/g, '');

  // Find the class extending TemplateLogic
  const match = code.match(/class\s+(\w+)\s+extends\s+TemplateLogic/);
  if (!match) {
    return { error: 'Compiled output does not contain a class extending TemplateLogic. Ensure your logic class extends TemplateLogic.' };
  }
  code += `\nreturn ${match[1]};\n`;

  return { code };
}

describe('Code Transformation (export stripping + return injection)', () => {
  it('should strip export class and append return', () => {
    const input = `export class CounterLogic extends TemplateLogic<any> {
  async init(data) { return {}; }
  async trigger(data, req, state) { return {}; }
}`;
    const result = transformCode(input);
    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).not.toContain('export class');
      expect(result.code).toContain('class CounterLogic');
      expect(result.code).toContain('return CounterLogic;');
    }
  });

  it('should strip export default', () => {
    const input = `class MyLogic extends TemplateLogic<any> {}
export default MyLogic;`;
    const result = transformCode(input);
    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).not.toContain('export default');
      expect(result.code).toContain('return MyLogic;');
    }
  });

  it('should return an error when no class extends TemplateLogic', () => {
    const input = `class SomeOtherClass {
  doStuff() { return 42; }
}`;
    const result = transformCode(input);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('does not contain a class extending TemplateLogic');
    }
  });

  it('should return an error for empty code', () => {
    const result = transformCode('');
    expect('error' in result).toBe(true);
  });

  it('should handle export in a string/comment without breaking', () => {
    const input = `// This has export class in a comment
class RealLogic extends TemplateLogic<any> {
  async init(data) { return { state: {} }; }
  async trigger(data, req, state) {
    const msg = "export class fake";
    return { result: {}, state };
  }
}`;
    const result = transformCode(input);
    expect('code' in result).toBe(true);
    if ('code' in result) {
      expect(result.code).toContain('return RealLogic;');
    }
  });
});
