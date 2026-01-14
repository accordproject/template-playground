import { createContext, useContext, useState, ReactNode } from "react";

export interface MarkdownEditorCommands {
  toggleBold: () => void;
  toggleItalic: () => void;
  insertLink: () => void;
  toggleHeading1: () => void;
  toggleHeading2: () => void;
  toggleHeading3: () => void;
  toggleUnorderedList: () => void;
  toggleOrderedList: () => void;
  insertImage: () => void;
}

interface MarkdownEditorContextType {
  commands: MarkdownEditorCommands | undefined;
  setCommands: (commands: MarkdownEditorCommands | undefined) => void;
  hasSelection: boolean;
  setHasSelection: (hasSelection: boolean) => void;
}

const MarkdownEditorContext = createContext<MarkdownEditorContextType | undefined>(
  undefined
);

export const MarkdownEditorProvider = ({ children }: { children: ReactNode }) => {
  const [commands, setCommands] = useState<MarkdownEditorCommands | undefined>(
    undefined
  );
  const [hasSelection, setHasSelection] = useState(false);

  return (
    <MarkdownEditorContext.Provider value={{ commands, setCommands, hasSelection, setHasSelection }}>
      {children}
    </MarkdownEditorContext.Provider>
  );
};

export const useMarkdownEditorContext = () => {
  const context = useContext(MarkdownEditorContext);
  if (context === undefined) {
    throw new Error(
      "useMarkdownEditorContext must be used within a MarkdownEditorProvider"
    );
  }
  return context;
};

