const editorActivityMap: Map<string, number> = new Map();

export const updateEditorActivity = (
  editorType: "markdown" | "concerto" | "json",
) => {
  editorActivityMap.set(editorType, Date.now());
};

export const getLastActivity = (
  editorType: "markdown" | "concerto" | "json",
): number => {
  return editorActivityMap.get(editorType) || 0;
};

export const clearActivity = (editorType: "markdown" | "concerto" | "json") => {
  editorActivityMap.delete(editorType);
};
