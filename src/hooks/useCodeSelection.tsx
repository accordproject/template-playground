import { useState } from 'react';
import * as monaco from 'monaco-editor';
import useAppStore from '../store/store';
import CodeSelectionMenu from '../components/CodeSelectionMenu';

export const useCodeSelection = (editorType: 'markdown' | 'concerto' | 'json') => {
  const [selectedText, setSelectedText] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const enableCodeSelectionMenu = useAppStore((state) => state.aiConfig?.enableCodeSelectionMenu ?? true);


  const handleSelection = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const selection = editor.getSelection();
    if (selection && !selection.isEmpty()) {
      const selectedText = editor.getModel()?.getValueInRange(selection).trim();
      if (selectedText && selectedText.length > 0) {
        const position = editor.getScrolledVisiblePosition(selection.getStartPosition());
        const editorContainer = editor.getDomNode()?.closest('.editorwrapper');
        const editorRect = editorContainer?.getBoundingClientRect();

        let x: number, y: number;

        if (editorRect && position) {
          x = Math.max(editorRect.left + 20, Math.min(position.left, editorRect.right - 150));
          y = Math.max(editorRect.top + 20, Math.min(position.top, editorRect.bottom - 50));

          x = Math.max(10, Math.min(x, window.innerWidth - 150));
          y = Math.max(10, Math.min(y, window.innerHeight - 50));
        } else if (position) {
          x = Math.max(10, Math.min(position.left, window.innerWidth - 150));
          y = Math.max(10, Math.min(position.top, window.innerHeight - 50));
        } else {
          return;
        }

        setSelectedText(selectedText);
        setMenuPosition({
          x: x,
          y: y
        });
        setShowMenu(true);
      }
    } else {
      setShowMenu(false);
    }
  }

  const closeMenu = () => {
    setShowMenu(false);
    setSelectedText('');
    setMenuPosition(null);
  };

  const MenuComponent = (enableCodeSelectionMenu && showMenu && selectedText && menuPosition) ? (
    <CodeSelectionMenu
      selectedText={selectedText}
      position={menuPosition}
      onClose={closeMenu}
      editorType={editorType}
    />
  ) : null;

  return {
    handleSelection,
    closeMenu,
    MenuComponent
  };
};
