import { Modal, Table, Tag } from 'antd';

interface KeyboardShortcut {
  keys: string;
  action: string;
  description?: string;
}

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Alt + E', action: 'Toggle Editors Panel', description: 'Show/hide the code editor panel' },
  { keys: 'Alt + P', action: 'Toggle Preview Panel', description: 'Show/hide the preview panel' },
  { keys: 'Alt + B', action: 'Toggle Problems Panel', description: 'Show/hide the problems/errors panel' },
  { keys: 'Alt + A', action: 'Toggle AI Chat Panel', description: 'Show/hide the AI assistant chat panel' },
  { keys: 'Alt + O', action: 'Show Preview Output', description: 'Toggle preview panel output' },
  { keys: 'Alt + D', action: 'Toggle Dark Mode', description: 'Switch between light and dark theme' },
  { keys: 'Alt + S', action: 'Copy Share Link', description: 'Copy shareable link to clipboard' },
  { keys: 'Alt + T', action: 'Start Tour', description: 'Launch the interactive tutorial' },
  { keys: 'Alt + L', action: 'Navigate to Learn', description: 'Go to the learning path page' },
  { keys: 'Alt + K', action: 'Reset Workspace', description: 'Reset all workspace settings' },
  { keys: 'Alt + 1', action: 'Open Accord Project GitHub', description: 'Visit AP GitHub repository' },
  { keys: 'Alt + 2', action: 'Open Accord Project Discord', description: 'Join AP Discord community' },
];

const columns = [
  {
    title: 'Keyboard Shortcut',
    dataIndex: 'keys',
    key: 'keys',
    width: '20%',
    render: (text: string) => <Tag color="blue">{text}</Tag>,
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    width: '25%',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    width: '55%',
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  return (
    <Modal
      title="Keyboard Shortcuts"
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={null}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      <Table
        columns={columns}
        dataSource={KEYBOARD_SHORTCUTS.map((shortcut, index) => ({
          ...shortcut,
          key: index,
        }))}
        pagination={false}
        size="small"
      />
    </Modal>
  );
};

export default KeyboardShortcutsModal;
