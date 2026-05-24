/**
 * logicTypeStubs.ts — Type stubs for Monaco IntelliSense in the Logic Editor
 *
 * ACCORD_TYPE_STUBS: Copied verbatim from @accordproject/template-engine dist/index.d.ts
 * These are declared as global ambient types so users never need to import
 * TemplateLogic — exactly matching how the engine treats these types.
 *
 * generateModelTypeStubs: Uses concerto-codegen's TypescriptVisitor to
 * dynamically generate TypeScript interfaces from the user's .cto model,
 * giving users autocomplete for their own contract data types.
 */

// ---------------------------------------------------------------------------
// Core Accord Project type stubs — declared globally, no import needed
// Source: @accordproject/template-engine dist/index.d.ts
// ---------------------------------------------------------------------------
export const ACCORD_TYPE_STUBS = `
declare interface IConcept { $class: string; }
declare interface ITransaction extends IConcept { $timestamp: string | Date; }
declare interface IEvent extends IConcept { $timestamp: string | Date; }
declare interface IState { $identifier: string; [key: string]: unknown; }
declare interface IRequest extends ITransaction { [key: string]: unknown; }
declare interface IResponse extends ITransaction { [key: string]: unknown; }
declare interface IAsset extends IConcept { $identifier: string; }
declare interface IContract extends IAsset { contractId: string; [key: string]: unknown; }
declare interface IClause extends IAsset { clauseId: string; [key: string]: unknown; }

declare interface EngineResponse<S = any> {
  state?: S;
  events?: any[];
}
declare interface TriggerResponse<S = any> extends EngineResponse<S> {
  result?: any;
  response?: any;
}
declare interface InitResponse<S = any> extends EngineResponse<S> {}

declare type TemplateData = IContract | IClause | any;

/**
 * Extend this class with your contract logic.
 * Use 'any' for T and S for maximum flexibility.
 *
 * @example
 * class MyLogic extends TemplateLogic<any> {
 *   async trigger(data: any, request: any, state: any) {
 *     return { result: { $class: '...', $timestamp: new Date().toISOString() } };
 *   }
 * }
 * export default MyLogic;
 */
declare abstract class TemplateLogic<T = any, S = any> {
  abstract trigger(data: T, request: any, state: S): Promise<any>;
  init(data: T): Promise<any>;
}
`;

// ---------------------------------------------------------------------------
// Dynamic model type stubs — generated from the user's Concerto model
// ---------------------------------------------------------------------------

/**
 * Generates TypeScript interface declarations from a Concerto .cto model string.
 * These are injected into Monaco as addExtraLib() stubs so users get
 * autocomplete for their own model types (e.g. IMyContract, IMyRequest).
 *
 * Uses concerto-codegen's TypescriptVisitor — the same mechanism the engine
 * uses in TypeScriptCompilationContext.
 *
 * Returns empty string on failure (non-fatal: IntelliSense degrades gracefully).
 */
export async function generateModelTypeStubs(modelCto: string): Promise<string> {
  try {
    const { ModelManager } = await import('@accordproject/concerto-core');

    // concerto-codegen ships a browser UMD bundle — safe to import in browser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const concertoCodegen = await import('@accordproject/concerto-codegen') as any;

    // The TypescriptVisitor lives under CodeGen in the package
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const TypescriptVisitor = concertoCodegen?.CodeGen?.TypescriptVisitor
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ?? concertoCodegen?.TypescriptVisitor;

    if (!TypescriptVisitor) {
      return ''; // package structure mismatch — degrade gracefully
    }

    // @ts-expect-error `offline` is supported at runtime but not yet in published typings
    const modelManager = new ModelManager({ strict: true, offline: true });

    // Load bundled standard models so common URL imports resolve without network access
    try {
      const { loadBundledModels } = await import('./modelCache');
      loadBundledModels(modelManager);
    } catch {
      // ignore - stubs will be generated only from the local model
    }

    modelManager.addCTOModel(modelCto, undefined, true);

    // Accumulate generated TypeScript into a string
    let result = '';
    const fileMap: Record<string, string> = {};
    let currentFile = '';

    const writer = {
      openFile: (fileName: string) => {
        currentFile = fileName;
        fileMap[fileName] = '';
      },
      writeLine: (_depth: number, line: string) => {
        fileMap[currentFile] = (fileMap[currentFile] ?? '') + line + '\n';
      },
      closeFile: () => {
        currentFile = '';
      },
      getFilesInMemory: () => new Map(Object.entries(fileMap)),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const visitor = new TypescriptVisitor();
    modelManager.accept(visitor, { fileWriter: writer });

    Object.values(fileMap).forEach((content) => {
      result += content + '\n';
    });

    return result;
  } catch {
    return ''; // non-fatal — Monaco IntelliSense degrades gracefully
  }
}
