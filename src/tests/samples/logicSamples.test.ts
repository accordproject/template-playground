import { describe, it, expect } from 'vitest';
import useAppStore from '../../store/store';
import { SAMPLES } from '../../samples';
import * as counterLogic from '../../samples/counterLogic';

type LogicInstance = {
  init?: (data: unknown) => Promise<{ state?: unknown } | undefined>;
  trigger: (data: unknown, request: unknown, state: unknown) => Promise<{ result?: { $class?: string } }>;
};

/*
 * Compiles logic with the real template engine, as the browser does, and
 * returns the store state afterwards.
 */
async function compile(model: string, template: string, logic: string) {
  useAppStore.setState({ modelCto: model, templateMarkdown: template, logicTs: logic });
  await useAppStore.getState().compileLogic();
  return useAppStore.getState();
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Evaluates the compiled code the same way the sandbox worker does.
const loadLogicClass = (code: string) =>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  (new Function(code) as () => new () => LogicInstance)();

describe('samples with logic', () => {
  const logicSamples = SAMPLES.filter((s) => s.LOGIC);

  it('includes every sample that has logic', () => {
    expect(logicSamples.length).toBeGreaterThanOrEqual(6);
  });

  for (const sample of logicSamples) {
    it(`${sample.NAME} compiles and runs init and trigger`, async () => {
      const state = await compile(sample.MODEL, sample.TEMPLATE, sample.LOGIC!);
      expect(state.compilationErrors).toEqual([]);
      expect(state.compiledLogicJs).toBeTruthy();

      const LogicClass = loadLogicClass(state.compiledLogicJs!);
      const logic = new LogicClass();
      const data = clone(sample.DATA);

      const initResponse = typeof logic.init === 'function' ? await logic.init(data) : undefined;
      const request = clone(sample.REQUEST ?? {});
      const response = await logic.trigger(data, request, initResponse?.state);
      expect(response.result?.$class).toBeTruthy();
    }, 60000);
  }
});

describe('compileLogic output', () => {
  it('strips the export marker TypeScript emits for type-only imports', async () => {
    const logic = `import type { ICounterRequest } from './generated/org.acme.counter@1.0.0';

class Logic extends TemplateLogic<any> {
  async trigger(data: any, request: ICounterRequest) {
    return {
      result: {
        $class: 'org.acme.counter@1.0.0.CounterResponse',
        $timestamp: new Date().toISOString(),
        message: 'ok',
        newCount: request.increment,
      },
      events: [],
    };
  }
}`;
    const state = await compile(counterLogic.MODEL, counterLogic.TEMPLATE, logic);
    expect(state.compilationErrors).toEqual([]);
    expect(state.compiledLogicJs).not.toMatch(/^export/m);
    expect(() => loadLogicClass(state.compiledLogicJs!)).not.toThrow();
  }, 60000);
});
