/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { ModelManager } from '@accordproject/concerto-core';
import { TemplateMarkInterpreter } from '@accordproject/template-engine';
import { TemplateMarkTransformer } from '@accordproject/markdown-template';
import { transform } from '@accordproject/markdown-transform';

const INITIAL_MODEL = `namespace hello@1.0.0
import org.accordproject.money@0.3.0.{MonetaryAmount} from https://models.accordproject.org/money@0.3.0.cto

concept Address {
    o String line1
    o String city
    o String state
    o String country
}

@template
concept TemplateData {
    o String name
    o Address address
    o Integer age optional
    o MonetaryAmount salary
    o String[] favoriteColors
}`;

const INITIAL_TEMPLATE = `### Welcome {{name}}!

Today is **{{% return now.format('DD MMMM YYYY') %}}.**

{{#clause address}}  
#### Address
{{line1}}  
{{city}}, {{state}}  
{{country}}  
{{/clause}}

- You are *{{age}}* years old
- Your monthly salary is {{salary as "0,0.00 CCC"}}
- Your favorite colours are {{#join favoriteColors}}

> “Without deviation from the norm, progress is not possible.” 
 ― Frank Zappa
`;

const INITIAL_DATA = {
    "$class" : "hello@1.0.0.TemplateData",
    "name": "John Doe",
    "address" : {
        "line1" : "1 Main Street",
        "city" : "Boson",
        "state" : "MA",
        "country" : "USA"
    },
    "age" : 42,
    "salary": {
        "$class": "org.accordproject.money@0.3.0.MonetaryAmount",
        "doubleValue": 1500,
        "currencyCode": "EUR"
    },
    "favoriteColors" : ['red', 'green', 'blue']
}

interface AppState {
    templateMarkdown: string
    modelCto: string
    data: string
    agreementHtml: string
    error: string|undefined
    setTemplateMarkdown: (template: string) => Promise<void>
    setModelCto: (model: string) => Promise<void>
    setData: (data: string) => Promise<void>
    rebuild: () => Promise<void>
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

const useAppStore = create<AppState>()(
    immer(
        devtools(
            (set,get) => ({
                templateMarkdown: INITIAL_TEMPLATE,
                modelCto: INITIAL_MODEL,
                data: JSON.stringify(INITIAL_DATA, null, 2),
                agreementHtml: '',
                error: undefined,
                rebuild: async() => {
                    try {
                        const result = await rebuild(get().templateMarkdown, get().modelCto, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        console.log(error);
                        set(() => ({ error: error.toString() }));
                    }
                },
                setTemplateMarkdown: async (template: string) => {
                    try {
                        const result = await rebuild(template, get().modelCto, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        console.log(error);
                        set(() => ({ error: error.toString() }));
                    }
                    set(() => ({ templateMarkdown: template }))
                },
                setModelCto: async (model: string) => {
                    try {
                        const result = await rebuild(get().templateMarkdown, model, get().data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        console.log(error);
                        set(() => ({ error: error.toString() }));
                    }
                    set(() => ({ modelCto: model }))
                },
                setData: async (data: string) => {
                    try {
                        const result = await rebuild(get().templateMarkdown, get().modelCto, data);
                        set(() => ({ agreementHtml: result, error: undefined }));
                    }
                    catch(error:any) {
                        console.log(error);
                        set(() => ({ error: error.toString() }));
                    }
                    set(() => ({ data }))
                }
            })
        )
    )
)

export default useAppStore;