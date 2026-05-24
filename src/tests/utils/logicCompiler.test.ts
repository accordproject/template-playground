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
    expect(result.jsCode).toContain('class TemplateLogic');
    expect(result.jsCode).toContain('class DemoLogic extends TemplateLogic');
  });

  it('returns diagnostics for invalid TypeScript input', async () => {
    const source = 'class Bad {';

    const result = await compileLogicTs(source);

    expect(result.hasError).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
