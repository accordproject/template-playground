import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, ConfigProvider, Divider, Space, Spin, Typography, theme } from 'antd';
import { CloseOutlined, InfoCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { sendMessage } from '../ai-assistant/chatRelay';
import { CodeSelectionMenuProps } from '../types/components/AIAssistant.types';
import useAppStore from '../store/store';
import ReactMarkdown from "react-markdown";
import * as monaco from 'monaco-editor';

const CodeSelectionMenu: React.FC<CodeSelectionMenuProps> = (props) => {
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const isDarkMode = backgroundColor === '#121212';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <CodeSelectionMenuContent {...props} />
    </ConfigProvider>
  );
};

const CodeSelectionMenuContent: React.FC<CodeSelectionMenuProps> = ({
  selectedText,
  position,
  onClose,
  editorType,
}) => {
  const { token } = theme.useToken();
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const explanationRef = useRef<HTMLDivElement>(null);
  const aiConfig = useAppStore((state) => state.aiConfig);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const setAIChatOpen = useAppStore((state) => state.setAIChatOpen);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleClose = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsExplaining(false);
    setShowExplanation(false);
    onClose();
  }, [abortController, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        (!explanationRef.current || !explanationRef.current.contains(event.target as Node))
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  const editorsContent = useAppStore((state) => ({
      editorTemplateMark: state.editorValue,
      editorModelCto: state.editorModelCto,
      editorAgreementData: state.editorAgreementData,
  }));

  const handleExplain = async () => {
    if (!aiConfig) {
      setSettingsOpen(true);
      return;
    }

    if (abortController) {
      abortController.abort();
    }

    setShowExplanation(true);
    setIsExplaining(true);
    setExplanation('');

    try {
      const selectedCode = `Code: \n \`\`\`${selectedText}\`\`\` \n`
      
      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      
      await sendMessage(
        selectedCode,
        'explainCode',
        editorsContent,
        false,
        editorType,
        (chunk) => {
          if (!newAbortController.signal.aborted) {
            setExplanation(prev => prev + chunk);
          }
        },
        (error) => {
          if (!newAbortController.signal.aborted) {
            setExplanation(`Error: ${error.message}`);
            setIsExplaining(false);
          }
        },
        () => {
          if (!newAbortController.signal.aborted) {
            setIsExplaining(false);
          }
          setAbortController(null);
        }
      );
    } catch (error) {
      if (abortController && !abortController.signal.aborted) {
        setExplanation(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsExplaining(false);
      }
    }
  };

  const handleChat = async () => {
    if (!aiConfig) {
      setSettingsOpen(true);
      return;
    }

    if (abortController) {
      abortController.abort();
    }

    setAIChatOpen(true);
    onClose();
    
    const selectedCode = `Code: \n \`\`\`${selectedText}\`\`\` \n`
    await sendMessage(
      selectedCode,
      'explainCode',
      editorsContent,
      true,
      editorType
    );
  };

  const popupPosition = {
    left: Math.max(300, Math.min(position.x, window.innerWidth - 350)),
    top: isExplaining ? position.y - 20 : Math.max(10, Math.min(position.y - 20, window.innerHeight - 300)),
  };
  
  useEffect(() => {
    if (explanationRef.current && showExplanation) {
      const popup = explanationRef.current;
      const rect = popup.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        popup.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
    }
  }, [showExplanation, position]);

  if (showExplanation) {
    return (
      <div
        ref={explanationRef}
        style={{
          position: 'fixed',
          left: popupPosition.left,
          top: popupPosition.top,
          maxHeight: '80vh',
          maxWidth: 'min(28rem, 80vw)',
          zIndex: 50,
        }}
      >
        <Card
          size="small"
          bodyStyle={{ padding: 16, position: 'relative' }}
          style={{
            boxShadow: token.boxShadowSecondary,
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
            aria-label="Close explanation"
            style={{ position: 'absolute', top: 4, right: 4 }}
          />
          <div
            style={{
              maxHeight: 256,
              paddingRight: 24,
              overflowY: isExplaining ? 'hidden' : 'auto',
            }}
          >
            {isExplaining ? (
              <Space align="center" size={8}>
                <Spin size="small" />
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  Explaining...
                </Typography.Text>
              </Space>
            ) : (
              <Typography.Text style={{ fontSize: 14, display: 'block' }}>
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => (
                      <pre
                        style={{
                          backgroundColor: token.colorFillTertiary,
                          padding: 8,
                          borderRadius: token.borderRadiusSM,
                          overflowX: 'auto',
                        }}
                      >
                        {children}
                      </pre>
                    ),
                    code: ({ children, className }) => (
                      <code
                        className={className}
                        style={{
                          backgroundColor: token.colorFillSecondary,
                          color: token.colorText,
                          padding: '2px 4px',
                          borderRadius: token.borderRadiusSM,
                        }}
                      >
                        {children}
                      </code>
                    ),
                  }}
                >
                  {explanation}
                </ReactMarkdown>
              </Typography.Text>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      data-testid="code-selection-menu"
      style={{
        position: 'fixed',
        left: Math.max(10, Math.min(225, window.innerWidth - 150)),
        top: Math.max(10, Math.min(position.y, window.innerHeight - 50)),
        minWidth: 120,
        zIndex: 50,
      }}
    >
      <Card
        size="small"
        bodyStyle={{ padding: 4 }}
        style={{
          boxShadow: token.boxShadowSecondary,
        }}
      >
        <Space align="center" size={0} style={{ display: 'flex', width: '100%' }}>
          <Button
            type="text"
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => void handleExplain()}
            style={{ flex: 1 }}
          >
            Explain
          </Button>
          <Divider type="vertical" style={{ margin: '0 2px' }} />
          <Button
            type="text"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => void handleChat()}
            style={{ flex: 1 }}
          >
            Chat
          </Button>
        </Space>
      </Card>
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
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

export default CodeSelectionMenu;
