import { createContext, useContext, useState, ReactNode } from "react";

import { MarkdownEditorCommands } from "../types/MarkdownEditor.types";

interface MarkdownEditorContextType {
  commands: MarkdownEditorCommands | undefined;
  setCommands: (commands: MarkdownEditorCommands | undefined) => void;
}

const MarkdownEditorContext = createContext<MarkdownEditorContextType | undefined>(
  undefined
);

export const MarkdownEditorProvider = ({ children }: { children: ReactNode }) => {
  const [commands, setCommands] = useState<MarkdownEditorCommands | undefined>(
    undefined
  );

  return (
    <MarkdownEditorContext.Provider value={{ commands, setCommands }}>
      {children}
    </MarkdownEditorContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMarkdownEditorContext = () => {
  const context = useContext(MarkdownEditorContext);
  if (context === undefined) {
    throw new Error(
      "useMarkdownEditorContext must be used within a MarkdownEditorProvider"
    );
  }
  return context;
};

