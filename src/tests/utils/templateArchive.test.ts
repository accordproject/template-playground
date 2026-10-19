/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect } from "vitest";
import { ModelManager } from "@accordproject/concerto-core";
import { TemplateMarkInterpreter } from "@accordproject/template-engine";
import { TemplateMarkTransformer } from "@accordproject/markdown-template";
import { transform } from "@accordproject/markdown-transform";
import { BUNDLED_MODELS, loadBundledModels } from "../../utils/modelCache";
import JSZip from "jszip";
import {
  DEFAULT_TEMPLATE_NAME,
  buildExportArchive,
  buildTemplateArchive,
  buildTemplateArchiveBlob,
  templateSlug,
  readTemplateArchive,
  archiveFileName,
  sampleDataFromModel,
  ensureTemplateDecorator,
  unsupportedLogicImports,
  findLogicEntry,
} from "../../utils/templateArchive";
import * as copyright from "../../samples/copyrightLicense";
import { describeLogicModel, scaffoldFromModel } from "../../editors/logicSource";
import * as blank from "../../samples/blank";
import * as perishable from "../../samples/perishableGoods";
import * as counter from "../../samples/counterLogic";

const TIMEOUT = 60_000;

/** Renders the way the app's rebuild does: TemplateMark → CiceroMark (with the data) → HTML. */
const render = async (templateMarkdown: string, modelCto: string, data: object): Promise<string> => {
  const modelManager = new ModelManager({ offline: true });
  loadBundledModels(modelManager);
  modelManager.addCTOModel(modelCto, undefined, true);
  const engine = new TemplateMarkInterpreter(modelManager as never, {});
  const templateMark = new TemplateMarkTransformer().fromMarkdownTemplate({ content: templateMarkdown }, modelManager, "contract", {
    verbose: false,
  }) as object;
  const ciceroMark = await engine.generate(templateMark, data as never);
  return (await transform(ciceroMark.toJSON() as unknown, "ciceromark_parsed", ["html"], {}, { verbose: false })) as string;
};

const libraryModel = `namespace org.acme.hello@1.0.0

import org.accordproject.contract@0.2.0.Contract from https://models.accordproject.org/accordproject/contract@0.2.0.cto

asset HelloWorldContract extends Contract {
  o String name
}`;

describe("template archive", () => {
  it("names files after the template", () => {
    expect(archiveFileName("Late Payment Penalty (with Logic)")).toBe("late-payment-penalty-with-logic.cta");
    expect(archiveFileName("!!!")).toBe(`${DEFAULT_TEMPLATE_NAME}.cta`);
  });

  it("round-trips a template, its data and its logic", async () => {
    const bytes = await buildTemplateArchive(
      {
        templateMarkdown: counter.TEMPLATE,
        modelCto: counter.MODEL,
        data: JSON.stringify(counter.DATA),
        logicTs: counter.LOGIC,
        requestJson: '{"$class":"org.acme.counter@1.0.0.CounterRequest","increment":1}',
      },
      "Counter",
    );
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(["package.json", "text/grammar.tem.md", "model/model.cto", "logic/logic.ts"]));

    const back = await readTemplateArchive(bytes, "fallback");
    expect(back.name).toBe("Counter");
    expect(back.templateMarkdown).toBe(counter.TEMPLATE);
    expect(back.modelCto).toBe(counter.MODEL);
    expect(back.logicTs).toBe(counter.LOGIC);
    expect(JSON.parse(back.data)).toEqual(counter.DATA);
    expect(back.requestJson).toBe('{"$class":"org.acme.counter@1.0.0.CounterRequest","increment":1}');
    expect(back.warnings).toEqual([]);
  }, TIMEOUT);

  it("rejects things that are not templates", async () => {
    await expect(readTemplateArchive(new Uint8Array([1, 2, 3]), "x")).rejects.toThrow(/not a template archive/);
    const zip = new JSZip();
    zip.file("package.json", "{}");
    await expect(readTemplateArchive(await zip.generateAsync({ type: "uint8array" }), "x")).rejects.toThrow(/grammar/);
  });

  it("refuses templates written for Cicero 0.x", async () => {
    const ergo = new JSZip();
    ergo.file("package.json", JSON.stringify({ name: "helloworld", accordproject: { cicero: "^0.25.0" } }));
    ergo.file("text/grammar.tem.md", "Hello {{name}}.");
    ergo.file("model/model.cto", libraryModel);
    ergo.file("logic/logic.ergo", "contract X over Y {}");
    await expect(readTemplateArchive(await ergo.generateAsync({ type: "uint8array" }), "x")).rejects.toThrow(/Ergo/);

    const old = new JSZip();
    old.file("package.json", JSON.stringify({ name: "old", accordproject: { cicero: "^0.21.0" } }));
    old.file("text/grammar.tem.md", "Hello {{name}}.");
    old.file("model/model.cto", libraryModel);
    await expect(readTemplateArchive(await old.generateAsync({ type: "uint8array" }), "x")).rejects.toThrow(/Cicero \^0\.21\.0/);
  });

  it("imports a library-style archive: no data.json, undecorated model, dependency models alongside", async () => {
    const zip = new JSZip();
    zip.file(
      "package.json",
      JSON.stringify({ name: "helloworld", displayName: "Hello World", accordproject: { runtime: "typescript", cicero: "^1.0.0" } }),
    );
    zip.file("text/grammar.tem.md", "Name of the person to greet: {{name}}.");
    zip.file("model/model.cto", libraryModel);
    zip.file("model/@models.accordproject.org.accordproject.contract@0.2.0.cto", "namespace ignored@1.0.0");
    const back = await readTemplateArchive(await zip.generateAsync({ type: "uint8array" }), "fallback");
    expect(back.name).toBe("Hello World");
    // The undecorated legacy model gains @template so the renderer can find the template concept.
    expect(back.modelCto).toContain("@template\nasset HelloWorldContract extends Contract");
    expect(back.logicTs).toBeUndefined();
    expect(back.warnings.join(" ")).toMatch(/generated from the model/);
    const data = JSON.parse(back.data) as Record<string, unknown>;
    expect(data.$class).toBe("org.acme.hello@1.0.0.HelloWorldContract");
    expect(typeof data.name).toBe("string");

    const html = await render(back.templateMarkdown, back.modelCto, data);
    expect(html).toContain("Name of the person to greet");
    expect(html).toContain(String(data.name));
    expect(html).not.toContain("{{");
  }, TIMEOUT);

  it("generates sample data for a @template concept", async () => {
    const data = JSON.parse(await sampleDataFromModel(blank.MODEL)) as Record<string, unknown>;
    expect(data.$class).toBe("hello@1.0.0.NewTemplate");
    expect(typeof data.exampleField).toBe("string");
  }, TIMEOUT);

  it("generates sample data for a template whose own namespace starts with org.accordproject.", async () => {
    const data = JSON.parse(await sampleDataFromModel(perishable.MODEL)) as Record<string, unknown>;
    expect(String(data.$class)).toContain("org.accordproject.perishablegoods");
  }, TIMEOUT);

  it("picks the undecorated template declaration by the archive's kind, not by declaration order", async () => {
    const undecorated = copyright.MODEL.replace("@template\n", "");
    // PaymentClause (a Clause) is declared before TemplateModel (the Contract).
    expect(undecorated.indexOf("PaymentClause")).toBeLessThan(undecorated.indexOf("TemplateModel"));
    expect(await ensureTemplateDecorator(undecorated, "contract")).toContain("@template\nasset TemplateModel");
    expect(await ensureTemplateDecorator(undecorated)).toContain("@template\nasset TemplateModel");
    expect(await ensureTemplateDecorator(undecorated, "clause")).toContain("@template\nasset PaymentClause");

    const twoContracts = `${undecorated}\n\nasset OtherModel extends Contract {\n  o String x\n}\n`;
    await expect(ensureTemplateDecorator(twoContracts, "contract")).rejects.toThrow(/several contract declarations \(TemplateModel, OtherModel\)/);
  }, TIMEOUT);

  it("records whether the exported template is a contract or a clause", async () => {
    const kindOf = async (modelCto: string) => {
      const zip = await JSZip.loadAsync(await buildExportArchive({ templateMarkdown: "x", modelCto, data: "{}" }, "K"));
      return (JSON.parse(await zip.file("package.json")!.async("string")) as { accordproject: { template: string } }).accordproject.template;
    };
    expect(await kindOf(copyright.MODEL)).toBe("contract");
    expect(await kindOf(copyright.MODEL.replace("@template\n", "").replace("asset PaymentClause", "@template\nasset PaymentClause"))).toBe("clause");
    expect(await kindOf(blank.MODEL)).toBe("contract");
    expect(await kindOf("not a model")).toBe("contract");
  }, TIMEOUT);

  it("refuses logic that imports other local files, but allows the generated model types", async () => {
    const model = counter.MODEL;
    expect(
      await unsupportedLogicImports(
        "import { IFoo } from './generated/org.acme.counter@1.0.0';\nimport type { X } from \"./generated/concerto@1.0.0\";\nimport type { M } from './generated/org.accordproject.money@0.3.0';",
        model,
      ),
    ).toEqual([]);
    // ./generated/ only holds the model's types; anything else there is a file the import would drop.
    expect(
      await unsupportedLogicImports("import { help } from './generated/helpers';\nimport { o } from './generated/org.other@1.0.0';", model),
    ).toEqual(["./generated/helpers", "./generated/org.other@1.0.0"]);
    expect(await unsupportedLogicImports("import { help } from './helpers';\nconst u = require('../util');\nimport('./lazy');\nexport * from './more';", model)).toEqual([
      "./helpers",
      "../util",
      "./lazy",
      "./more",
    ]);
    expect(await unsupportedLogicImports("import { v4 } from 'uuid';", model)).toEqual([]);

    const zip = new JSZip();
    zip.file("package.json", JSON.stringify({ name: "x", accordproject: { cicero: "^2.0.0" } }));
    zip.file("text/grammar.tem.md", blank.TEMPLATE);
    zip.file("model/model.cto", blank.MODEL);
    zip.file("logic/logic.ts", "import { help } from './helpers';\nexport default class {}");
    zip.file("logic/helpers.ts", "export const help = 1;");
    await expect(readTemplateArchive(await zip.generateAsync({ type: "uint8array" }), "x")).rejects.toThrow(/\.\/helpers/);
  }, TIMEOUT);

  it("ignores comments and strings that only look like imports", async () => {
    const logic = [
      "// import { help } from './helpers'",
      "/* import './old' */",
      'const note = "Copied from \'./draft\'";',
      "const t = `require('./tpl')`;",
      "export default class {}",
    ].join("\n");
    expect(await unsupportedLogicImports(logic, counter.MODEL)).toEqual([]);
  }, TIMEOUT);

  it("round-trips the Logic step's scaffold, and still accepts the older './<namespace>' imports", async () => {
    const scaffold = scaffoldFromModel(describeLogicModel(counter.MODEL));
    expect(scaffold).toMatch(/from '\.\/generated\/org\.acme\.counter@1\.0\.0'/);
    // Archives exported before the scaffold moved to ./generated/ import the namespace directly.
    expect(await unsupportedLogicImports(scaffold.replace("./generated/", "./"), counter.MODEL)).toEqual([]);
    const edited = scaffold.replace("ContractLogic", "EditedLogic");
    expect(await unsupportedLogicImports(edited, counter.MODEL)).toEqual([]);
    const bytes = await buildTemplateArchive(
      { templateMarkdown: counter.TEMPLATE, modelCto: counter.MODEL, data: JSON.stringify(counter.DATA), logicTs: edited },
      "Counter",
    );
    expect((await readTemplateArchive(bytes, "x")).logicTs).toBe(edited);
    // A sibling module that is not one of the model's namespaces is still refused.
    expect(await unsupportedLogicImports("import { x } from './org.other@1.0.0';", counter.MODEL)).toEqual(["./org.other@1.0.0"]);
  }, TIMEOUT);

  it("finds the logic entry point, or refuses to guess", () => {
    const generated = ["logic/concerto.ts", "logic/concerto@1.0.0.ts", "logic/org.acme@1.0.0.ts", "logic/logic.test.ts"];
    expect(findLogicEntry(["logic/logic.ts", "logic/main.ts", ...generated])).toBe("logic/logic.ts");
    expect(findLogicEntry(["logic/main.ts", ...generated])).toBe("logic/main.ts");
    expect(findLogicEntry(generated)).toBeUndefined();
    expect(() => findLogicEntry(["logic/a.ts", "logic/b.ts"])).toThrow(/several logic files/);
  });

  it("carries the archive's request.json for Simulate", async () => {
    const zip = new JSZip();
    zip.file("package.json", JSON.stringify({ name: "x", accordproject: { cicero: "^2.0.0" } }));
    zip.file("text/grammar.tem.md", blank.TEMPLATE);
    zip.file("model/model.cto", blank.MODEL);
    zip.file("data.json", JSON.stringify(blank.DATA));
    zip.file("logic/main.ts", "export default class {}");
    zip.file("request.json", '{"$class":"hello@1.0.0.Req"}');
    const back = await readTemplateArchive(await zip.generateAsync({ type: "uint8array" }), "x");
    expect(back.logicTs).toBe("export default class {}");
    expect(back.requestJson).toBe('{"$class":"hello@1.0.0.Req"}');
  }, TIMEOUT);
});

/** jsdom's Blob has no arrayBuffer(); FileReader reads it. */
const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const sources = { templateMarkdown: "Hello {{name}}", modelCto: "namespace org.example@1.0.0", logicTs: "class L {}" };

describe("templateSlug", () => {
  it("turns a sample name into a package name", () => {
    expect(templateSlug("Late Payment Penalty (with Logic)")).toBe("late-payment-penalty-with-logic");
    expect(templateSlug("New (Blank)")).toBe("new-blank");
  });

  it("falls back to the default name when nothing usable is left", () => {
    expect(templateSlug("")).toBe(DEFAULT_TEMPLATE_NAME);
    expect(templateSlug("(!)")).toBe(DEFAULT_TEMPLATE_NAME);
  });
});

describe("buildTemplateArchive (the store's runnable archive)", () => {
  it("packs package.json, text, model, the bundled models and logic", async () => {
    const zip = await JSZip.loadAsync(await buildTemplateArchive(sources, "my-template"));

    const pkg = JSON.parse(await zip.file("package.json")!.async("string")) as { name: string; accordproject: unknown };
    expect(pkg.name).toBe("my-template");
    expect(pkg.accordproject).toMatchObject({ template: "contract", cicero: "^3.0.0" });
    expect(await zip.file("text/grammar.tem.md")!.async("string")).toBe(sources.templateMarkdown);
    expect(await zip.file("model/model.cto")!.async("string")).toBe(sources.modelCto);
    expect(await zip.file("logic/logic.ts")!.async("string")).toBe(sources.logicTs);
    for (const model of BUNDLED_MODELS) {
      expect(zip.file(`model/${model.fileName}`)).not.toBeNull();
    }
    // The store's archive has no sample data.
    expect(zip.file("data.json")).toBeNull();
  });

  it("leaves logic out of a template without logic", async () => {
    const zip = await JSZip.loadAsync(await buildTemplateArchive({ ...sources, logicTs: "" }));
    expect(zip.file("logic/logic.ts")).toBeNull();
  });

  it("builds the same archive as a zip Blob", async () => {
    const blob = await buildTemplateArchiveBlob(sources);
    expect(blob.type).toBe("application/zip");
    const zip = await JSZip.loadAsync(await readBlob(blob));
    expect(await zip.file("model/model.cto")!.async("string")).toBe(sources.modelCto);
  });
});
