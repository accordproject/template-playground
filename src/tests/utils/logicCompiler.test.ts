import { describe, it, expect } from 'vitest';
import { compileLogicTs } from '../../utils/logicCompiler';

describe('compileLogicTs', () => {
  it('prepends the TemplateLogic runtime shim to compiled output', async () => {
    const source = `
class DemoLogic extends TemplateLogic<any> {
  async trigger(data: any, request: any, state: any) {
    return { result: { ok: true }, state };
  }
}
export default DemoLogic;
`;

    const result = await compileLogicTs(source);

    expect(result.hasError).toBe(false);
    
    // The compiler outputs a Data URI, so we must extract and decode the base64 part
    const base64Data = result.jsCode!.split(',')[1];
    const binary = atob(base64Data);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decodedJs = new TextDecoder().decode(bytes);

    expect(decodedJs).toContain('class TemplateLogic');
    expect(decodedJs).toContain('class DemoLogic extends TemplateLogic');
  });

  it('returns diagnostics for invalid TypeScript input', async () => {
    const source = 'class Bad {';

    const result = await compileLogicTs(source);

    expect(result.hasError).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
