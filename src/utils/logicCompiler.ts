/**
 * logicCompiler.ts — Compiles user TypeScript logic to JavaScript
 *
 * Uses ts.transpileModule() which:
 *   - Strips TypeScript type annotations → produces clean ES2020 JS
 *   - Does NOT type-check (Monaco handles that live in the editor)
 *   - Catches syntax errors that would prevent execution
 *   - Is synchronous and lightweight vs the full VFS compilation chain
 *
 * This mirrors the engine's noErrorValidation:true approach in twoslash —
 * the same trade-off: Monaco shows type errors, compiler just strips types.
 */

export interface CompileError {
  message: string;
  line?: number;
  column?: number;
}

export interface CompileResult {
  jsCode: string | null;
  errors: CompileError[];
  hasError: boolean;
}

/**
 * Runtime shim prepended to every compiled logic bundle.
 *
 * WHY: TemplateLogic is declared as a global ambient type in Monaco (for IntelliSense),
 * but that declaration is not a real JavaScript class — it only exists at type-check time.
 * When the compiled JS runs inside the Worker via dynamic import(), `TemplateLogic` must
 * exist as a real prototype-chain base. This shim provides that.
 *
 * The shim exactly mirrors the abstract class contract:
 *   - init()    → optional, returns undefined by default (stateless contracts)
 *   - trigger() → required, throws if not overridden (catches missing implementations early)
 */
const RUNTIME_SHIM = `
// ── Accord Project Playground Runtime Shim ──────────────────────────────────
// TemplateLogic base class — available as a global in your logic file.
// Do NOT import this; it is automatically injected before your code runs.
class TemplateLogic {
  /** Override to set up initial contract state. */
  async init(data) {
    return undefined;
  }
  /** Override to implement your business logic. Must return { result, state? }. */
  async trigger(data, request, state) {
    throw new Error(
      'trigger() is not implemented. Your class must override TemplateLogic.trigger().'
    );
  }
}
// ────────────────────────────────────────────────────────────────────────────
`;

export async function compileLogicTs(tsSource: string): Promise<CompileResult> {
  try {
    // Dynamic import keeps TypeScript out of the initial bundle chunk
    const ts = await import('typescript');

    const result = ts.transpileModule(tsSource, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        strict: false,
        experimentalDecorators: true,
        esModuleInterop: true,
      },
      reportDiagnostics: true,
    });

    const errors: CompileError[] = (result.diagnostics ?? []).map((d) => {
      const msg =
        typeof d.messageText === 'string'
          ? d.messageText
          : d.messageText.messageText;
      const pos =
        d.file && d.start !== undefined
          ? d.file.getLineAndCharacterOfPosition(d.start)
          : undefined;
      return {
        message: msg,
        line: pos ? pos.line + 1 : undefined,
        column: pos ? pos.character + 1 : undefined,
      };
    });

    const transpiled = result.outputText.trim();
    let jsCode = null;

    if (transpiled) {
      const fullCode = `${RUNTIME_SHIM}\n${transpiled}`;
      const bytes = new TextEncoder().encode(fullCode);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const encoded = btoa(binary);
      jsCode = `data:text/javascript;base64,${encoded}`;
    }

    return {
      jsCode,
      errors,
      hasError: errors.length > 0,
    };
  } catch (err: unknown) {
    // Fallback: TypeScript module failed to load
    return {
      jsCode: null,
      errors: [
        {
          message:
            'Failed to load TypeScript compiler: ' +
            (err instanceof Error ? err.message : String(err)),
        },
      ],
      hasError: true,
    };
  }
}
