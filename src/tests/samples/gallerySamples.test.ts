/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect } from 'vitest';
import { ModelManager } from '@accordproject/concerto-core';
import { TemplateMarkInterpreter } from '@accordproject/template-engine';
import { TemplateMarkTransformer } from '@accordproject/markdown-template';
import { transform } from '@accordproject/markdown-transform';
import { SAMPLES } from '../../samples';
import { START_SAMPLES } from '../../components/designV2/constants';
import { loadBundledModels } from '../../utils/modelCache';
import * as consulting from '../../samples/consultingAgreement';
import * as lease from '../../samples/residentialLease';

/**
 * Renders a sample the way the app store's rebuild does: TemplateMark → CiceroMark
 * (with the data) → HTML. The gallery samples are what a new user sees first,
 * so a TemplateMark or model mistake in one of them must fail here, not in the browser.
 * The engine's first run loads the bundled models, hence the generous timeout.
 */
const TIMEOUT = 60_000;
const render = async (templateMarkdown: string, modelCto: string, data: object): Promise<string> => {
  const modelManager = new ModelManager({ offline: true });
  loadBundledModels(modelManager);
  modelManager.addCTOModel(modelCto, undefined, true);
  const engine = new TemplateMarkInterpreter(modelManager as never, {});
  const transformer = new TemplateMarkTransformer();
  const templateMark = transformer.fromMarkdownTemplate({ content: templateMarkdown }, modelManager, 'contract', {
    verbose: false,
  }) as object;
  const ciceroMark = await engine.generate(templateMark, data as never);
  return (await transform(ciceroMark.toJSON() as unknown, 'ciceromark_parsed', ['html'], {}, { verbose: false })) as string;
};

describe('gallery samples', () => {
  it.each(START_SAMPLES.map((card) => [card.name, card.sampleName]))('%s renders through the engine', async (_name, sampleName) => {
    const sample = SAMPLES.find((s) => s.NAME === sampleName)!;
    const html = await render(sample.TEMPLATE, sample.MODEL, sample.DATA);
    expect(html).toContain('<');
    expect(html).not.toContain('{{');
  }, TIMEOUT);

  it('Consulting Agreement fills its variables and formats the date and the rate', async () => {
    const html = await render(consulting.TEMPLATE, consulting.MODEL, consulting.DATA);
    expect(html).toContain('Northwind Logistics Ltd');
    expect(html).toContain('Ana Ionescu');
    expect(html).toContain('1 October 2026');
    expect(html).toContain('650.00');
    expect(html).toContain('EUR');
  }, TIMEOUT);

  it('Residential Lease renders the conditional clauses, the list and the computed deposit', async () => {
    const html = await render(lease.TEMPLATE, lease.MODEL, lease.DATA);
    expect(html).toContain('1,250.00');
    expect(html).toContain('2,500.00'); // deposit = rent × depositMonths, from the formula
    expect(html).toContain('Broadband');
    expect(html).toContain('may keep pets');
    expect(html).toContain('Parking');
    expect(html).toContain('B7');
    expect(html).toContain('60.00');

    const noExtras = { ...lease.DATA, petsAllowed: false, parking: undefined };
    const plain = await render(lease.TEMPLATE, lease.MODEL, noExtras);
    expect(plain).toContain('No pets may be kept');
    expect(plain).not.toContain('6. Parking');
    expect(plain).not.toContain('B7');
  }, TIMEOUT);
});
