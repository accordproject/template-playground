export type LogicStatus = "dirty" | "compiling" | "failed" | "compiled" | "notCompiled" | "empty";

/**
 * The five states of the legacy logic editor's badge, in the same order of
 * precedence, computed from the same store fields.
 */
export const logicStatus = (s: {
  editorLogicTs: string;
  logicTs: string;
  isCompiling: boolean;
  compilationErrors: readonly unknown[];
  compiledLogicJs: string | null;
}): LogicStatus => {
  if (s.editorLogicTs !== s.logicTs) return "dirty";
  if (s.isCompiling) return "compiling";
  if (s.compilationErrors.length > 0) return "failed";
  if (s.compiledLogicJs) return "compiled";
  if (s.logicTs) return "notCompiled";
  return "empty";
};
