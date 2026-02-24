import { Modal } from "antd";
import useAppStore from "../store/store";

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ShortcutItem {
    keys: string;
    action: string;
}

const editorShortcuts: ShortcutItem[] = [
    { keys: "Ctrl + Z", action: "Undo" },
    { keys: "Ctrl + Y", action: "Redo" },
    { keys: "Ctrl + C", action: "Copy" },
    { keys: "Ctrl + V", action: "Paste" },
    { keys: "Ctrl + X", action: "Cut" },
    { keys: "Ctrl + F", action: "Find" },
    { keys: "Ctrl + H", action: "Find and Replace" },
    { keys: "Ctrl + /", action: "Toggle Comment" },
    { keys: "Ctrl + D", action: "Duplicate Line" },
    { keys: "Ctrl + Shift + K", action: "Delete Line" },
    { keys: "Alt + ↑", action: "Move Line Up" },
    { keys: "Alt + ↓", action: "Move Line Down" },
    { keys: "Ctrl + G", action: "Go to Line" },
];

const aiChatShortcuts: ShortcutItem[] = [
    { keys: "Enter", action: "Send Message" },
    { keys: "Shift + Enter", action: "Insert New Line" },
];

const ShortcutTable = ({ shortcuts, isDark }: { shortcuts: ShortcutItem[]; isDark: boolean }) => (
    <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
            <div
                key={index}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${isDark
                    ? "bg-slate-800/50"
                    : "bg-gray-100"
                    }`}
            >
                <kbd
                    className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md ${isDark
                        ? "bg-slate-700 text-cyan-300 border border-slate-500"
                        : "bg-gray-200 text-gray-800 border border-gray-300"
                        }`}
                >
                    {shortcut.keys}
                </kbd>
                <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {shortcut.action}
                </span>
            </div>
        ))}
    </div>
);

const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
    const backgroundColor = useAppStore((state) => state.backgroundColor);
    const isDark = backgroundColor !== '#ffffff';

    return (
        <Modal
            title={null}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={480}
            centered
            closeIcon={
                <span className={`text-xl ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}>
                    ✕
                </span>
            }
            bodyStyle={{ padding: 0 }}
            maskStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
            }}
            wrapClassName="keyboard-shortcuts-modal-wrap"
        >
            <div className={`${isDark ? "text-white" : "text-gray-900"}`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDark ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"}`}>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>⌨️</span>
                        <span>Keyboard Shortcuts</span>
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Speed up your workflow with these shortcuts
                    </p>
                </div>

                {/* Content */}
                <div
                    className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto overscroll-contain"
                    style={{
                        transform: 'translateZ(0)',
                        willChange: 'scroll-position',
                    }}
                >
                    {/* Editor Shortcuts Section */}
                    <div>
                        <h3 className={`flex items-center gap-2 text-sm font-semibold mb-3 ${isDark ? "text-cyan-400" : "text-blue-600"}`}>
                            <span>�</span>
                            <span>Editor Shortcuts</span>
                        </h3>
                        <ShortcutTable shortcuts={editorShortcuts} isDark={isDark} />
                    </div>

                    {/* AI Chat Section */}
                    <div>
                        <h3 className={`flex items-center gap-2 text-sm font-semibold mb-3 ${isDark ? "text-cyan-400" : "text-blue-600"}`}>
                            <span>💬</span>
                            <span>AI Chat</span>
                        </h3>
                        <ShortcutTable shortcuts={aiChatShortcuts} isDark={isDark} />
                    </div>
                </div>

                {/* Footer Tip */}
                <div className={`px-6 py-4 border-t ${isDark ? "border-slate-700 bg-slate-800/30" : "border-gray-200 bg-gray-50"}`}>
                    <p className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        <span className="text-yellow-500">💡</span>
                        <span>
                            <strong>Tip:</strong> Press <kbd className={`px-1.5 py-0.5 text-xs rounded ${isDark ? "bg-slate-700 text-cyan-300" : "bg-gray-200 text-gray-800"}`}>F1</kbd> in any editor to see all available commands.
                        </span>
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default KeyboardShortcutsModal;
