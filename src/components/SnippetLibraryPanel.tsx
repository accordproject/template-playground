import { useState } from 'react';
import { Collapse, Button, Tooltip, Input } from 'antd';
import {
    MdCode,
    MdDataObject,
    MdJavascript,
    MdClose,
    MdSearch,
    MdContentCopy
} from 'react-icons/md';
import { SNIPPET_GROUPS, Snippet, SnippetCategory } from '../constants/snippets';
import useAppStore from '../store/store';
import '../styles/components/SnippetLibraryPanel.css';

const { Panel } = Collapse;

interface SnippetLibraryPanelProps {
    editorType: SnippetCategory;
    onInsertSnippet: (code: string) => void;
}

const iconMap = {
    MdCode: MdCode,
    MdDataObject: MdDataObject,
    MdJavascript: MdJavascript,
};

const SnippetLibraryPanel: React.FC<SnippetLibraryPanelProps> = ({
    editorType,
    onInsertSnippet,
}) => {
    const { backgroundColor, textColor, toggleSnippetPanel } = useAppStore((state) => ({
        backgroundColor: state.backgroundColor,
        textColor: state.textColor,
        toggleSnippetPanel: state.toggleSnippetPanel,
    }));

    const [searchQuery, setSearchQuery] = useState('');
    const [activeKeys, setActiveKeys] = useState<string[]>([editorType]);

    const isDark = backgroundColor === '#121212';

    // Filter snippets based on editor type and search query
    const filteredGroups = SNIPPET_GROUPS.map((group) => ({
        ...group,
        snippets: group.snippets.filter((snippet) => {
            const matchesSearch =
                searchQuery === '' ||
                snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                snippet.code.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        }),
    })).filter((group) => group.snippets.length > 0);

    const handleInsert = (snippet: Snippet) => {
        onInsertSnippet(snippet.code);
    };

    const handleCopy = async (code: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div
            className="snippet-library-panel"
            style={{
                backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                color: textColor,
            }}
        >
            {/* Header */}
            <div
                className="snippet-library-header"
                style={{
                    backgroundColor: isDark ? '#252525' : '#e8e8e8',
                    borderBottom: `1px solid ${isDark ? '#333' : '#d9d9d9'}`,
                }}
            >
                <div className="snippet-library-title">
                    <MdCode size={20} style={{ marginRight: '8px' }} />
                    <span>Snippet Library</span>
                </div>
                <button
                    className="snippet-library-close-btn"
                    onClick={toggleSnippetPanel}
                    style={{
                        color: textColor,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    title="Close Snippet Panel"
                >
                    <MdClose size={20} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="snippet-library-search" style={{ padding: '12px' }}>
                <Input
                    placeholder="Search snippets..."
                    prefix={<MdSearch />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
                        color: textColor,
                        borderColor: isDark ? '#404040' : '#d9d9d9',
                    }}
                    allowClear
                />
            </div>

            {/* Snippet Categories */}
            <div className="snippet-library-content">
                <Collapse
                    activeKey={activeKeys}
                    onChange={(keys) => setActiveKeys(keys as string[])}
                    ghost
                    expandIconPosition="end"
                >
                    {filteredGroups.map((group) => {
                        const IconComponent = iconMap[group.icon as keyof typeof iconMap];
                        return (
                            <Panel
                                header={
                                    <div className="snippet-category-header">
                                        <IconComponent size={18} style={{ marginRight: '8px' }} />
                                        <span>{group.name}</span>
                                        <span className="snippet-count">({group.snippets.length})</span>
                                    </div>
                                }
                                key={group.key}
                                style={{
                                    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                                    borderBottom: `1px solid ${isDark ? '#333' : '#e8e8e8'}`,
                                }}
                            >
                                <div className="snippet-list">
                                    {group.snippets.map((snippet) => (
                                        <div
                                            key={snippet.id}
                                            className="snippet-item"
                                            style={{
                                                backgroundColor: isDark ? '#252525' : '#ffffff',
                                                borderColor: isDark ? '#404040' : '#e8e8e8',
                                            }}
                                        >
                                            <div className="snippet-item-header">
                                                <h4 className="snippet-title" style={{ color: textColor }}>
                                                    {snippet.title}
                                                </h4>
                                                <div className="snippet-actions">
                                                    <Tooltip title="Copy to clipboard">
                                                        <button
                                                            className="snippet-action-btn"
                                                            onClick={(e) => void handleCopy(snippet.code, e)}
                                                            style={{ color: textColor }}
                                                        >
                                                            <MdContentCopy size={16} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                            <p
                                                className="snippet-description"
                                                style={{ color: isDark ? '#b0b0b0' : '#666' }}
                                            >
                                                {snippet.description}
                                            </p>
                                            <pre
                                                className="snippet-code"
                                                style={{
                                                    backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
                                                    color: textColor,
                                                    borderColor: isDark ? '#404040' : '#e8e8e8',
                                                }}
                                            >
                                                <code>{snippet.code}</code>
                                            </pre>
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => handleInsert(snippet)}
                                                className="snippet-insert-btn"
                                                style={{
                                                    backgroundColor: '#19c6c7',
                                                    borderColor: '#19c6c7',
                                                }}
                                            >
                                                Insert at Cursor
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Panel>
                        );
                    })}
                </Collapse>

                {filteredGroups.length === 0 && (
                    <div
                        className="snippet-empty-state"
                        style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: isDark ? '#666' : '#999',
                        }}
                    >
                        <MdSearch size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No snippets found matching "{searchQuery}"</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SnippetLibraryPanel;
