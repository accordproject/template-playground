export type LogicStatus = "dirty" | "compiling" | "failed" | "compiled" | "notCompiled" | "empty";

/**
 * The states of the legacy logic editor's badge, computed from the same
 * store fields. Compiled JS outranks errors: a compile clears the JS and
 * sets it only on success, so errors alongside it come from running the
 * logic (init/trigger), not from compiling it.
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
  if (s.compiledLogicJs) return "compiled";
  if (s.compilationErrors.length > 0) return "failed";
  if (s.logicTs) return "notCompiled";
  return "empty";
};
