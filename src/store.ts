import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { debounce } from "ts-debounce";

import { ModelManager } from '@accordproject/concerto-core';
import { TemplateMarkInterpreter } from '@accordproject/template-engine';
import { TemplateMarkTransformer } from '@accordproject/markdown-template';
import { transform } from '@accordproject/markdown-transform';

import {SAMPLES, Sample} from './samples';
import * as playground from './samples/playground';

interface AppState {
    templateMarkdown: string
    modelCto: string
    data: string
    agreementHtml: string
    error: string|undefined
    samples: Array<Sample>
    sampleName: string;
    setTemplateMarkdown: (template: string) => Promise<void>
    setModelCto: (model: string) => Promise<void>
    setData: (data: string) => Promise<void>
    rebuild: () => Promise<void>
    init: () => Promise<void>
    loadSample: (name:string) => Promise<void>
}

async function rebuild(template: string, model: string, dataString: string) {
    const modelManager = new ModelManager({ strict: true });
    modelManager.addCTOModel(model, undefined, true);
    await modelManager.updateExternalModels();
    const engine = new TemplateMarkInterpreter(modelManager, {});

    const templateMarkTransformer = new TemplateMarkTransformer();

    const templateMarkDom = templateMarkTransformer.fromMarkdownTemplate({ content: template }, modelManager, 'contract', { verbose: false });
    // console.log(JSON.stringify(templateMarkDomEn, null, 2));

    const data = JSON.parse(dataString);

    const ciceroMark = await engine.generate(templateMarkDom, data);
    // console.log(JSON.stringify(ciceroMark.toJSON(), null, 2));
    return await transform(ciceroMark.toJSON(), 'ciceromark_parsed', ['html'], {}, { verbose: false });
}

const rebuildDeBounce = debounce(rebuild, 500);

function formatError(error:any) : string {
    console.log(error);
    if(typeof error === 'string') {
        return error;
    }
    else if(Array.isArray(error)) {
        return error.map( e => formatError(e)).join('\n');
    }
    else if(error.code) {
        const sub = error.errors ? formatError(error.errors) : '';
        const msg = error.renderedMessage ? error.renderedMessage : '';
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `Error: ${error.code} ${sub} ${msg}`;
    }
    return error.toString();
}

const useAppStore = create<AppState>()(
    immer(
        devtools(
            (set,get) => ({
                sampleName: playground.NAME,
                templateMarkdown: playground.TEMPLATE,
                modelCto: playground.MODEL,
                data: JSON.stringify(playground.DATA, null, 2),
                agreementHtml: '',
                error: undefined,
                samples: SAMPLES,
                init: async() => {
                    return get().rebuild();
                },
                loadSample: async(name:string) => {
                    const sample = SAMPLES.find( s => s.NAME === name);
                    if(sample) {
                        set(() => ({ 
                            sampleName: sample.NAME,
                            agreementHtml: undefined, 
                            error: undefined,
                            templateMarkdown: sample.TEMPLATE,
                            modelCto: sample.MODEL,
                            data: JSON.stringify(sample.DATA, null, 2)
                        }));
                        await get().rebuild();    
                    }
                },
                rebuild: async() => {
                    try {
                        const result = await rebuildDeBounce(get().templateMarkdown, get().modelCto, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        set(() => ({ error: formatError(error) }));
                    }
                },
                setTemplateMarkdown: async (template: string) => {
                    try {
                        const result = await rebuildDeBounce(template, get().modelCto, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        set(() => ({ error: formatError(error) }));
                    }
                    set(() => ({ templateMarkdown: template }))
                },
                setModelCto: async (model: string) => {
                    try {
                        const result = await rebuildDeBounce(get().templateMarkdown, model, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        set(() => ({ error: formatError(error) }));
                    }
                    set(() => ({ modelCto: model }))
                },
                setData: async (data: string) => {
                    try {
                        const result = await rebuildDeBounce(get().templateMarkdown, get().modelCto, data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        set(() => ({ error: formatError(error) }));
                    }
                    set(() => ({ data }))
                }
            })
        )
    )
)

export default useAppStore;