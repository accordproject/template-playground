import type { FC, CSSProperties } from "react";
import { Button, Space, Tooltip } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  LinkOutlined,
  PictureOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import { useMarkdownEditorContext } from "../contexts/MarkdownEditorContext";
import useAppStore from "../store/store";

export const TemplateMarkdownToolbar: FC = () => {
  const { commands: markdownEditorCommands } = useMarkdownEditorContext();
  const textColor = useAppStore((s) => s.textColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const isDarkMode = backgroundColor !== "#ffffff";

  /*
   * In dark mode the header background is dark (#374151 / #0f172a), so toolbar icons
   * must use a high-contrast light color (#f3f4f6), and in light mode standard dark slate.
   */
  const iconColor = isDarkMode ? "#f3f4f6" : textColor || "#374151";

  const buttonStyle: CSSProperties = {
    color: iconColor,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    height: "24px",
    minWidth: "24px",
  };

  return (
    <Space size={2} align="center" className="markdown-toolbar">
      <Tooltip title="Heading 1" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          onClick={() => markdownEditorCommands?.toggleHeading1?.()}
          title="Heading 1"
          aria-label="Heading 1"
        >
          <span style={{ fontWeight: 700, fontSize: "12px", lineHeight: 1 }}>H1</span>
        </Button>
      </Tooltip>

      <Tooltip title="Heading 2" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          onClick={() => markdownEditorCommands?.toggleHeading2?.()}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <span style={{ fontWeight: 700, fontSize: "12px", lineHeight: 1 }}>H2</span>
        </Button>
      </Tooltip>

      <Tooltip title="Heading 3" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          onClick={() => markdownEditorCommands?.toggleHeading3?.()}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <span style={{ fontWeight: 700, fontSize: "12px", lineHeight: 1 }}>H3</span>
        </Button>
      </Tooltip>

      <Tooltip title="Bold" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<BoldOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.toggleBold?.()}
          title="Bold"
          aria-label="Bold"
        />
      </Tooltip>

      <Tooltip title="Italic" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<ItalicOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.toggleItalic?.()}
          title="Italic"
          aria-label="Italic"
        />
      </Tooltip>

      <Tooltip title="Unordered list" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<UnorderedListOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.toggleUnorderedList?.()}
          title="Unordered list"
          aria-label="Unordered list"
        />
      </Tooltip>

      <Tooltip title="Ordered list" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<OrderedListOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.toggleOrderedList?.()}
          title="Ordered list"
          aria-label="Ordered list"
        />
      </Tooltip>

      <Tooltip title="Insert link" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<LinkOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.insertLink?.()}
          title="Insert link"
          aria-label="Insert link"
        />
      </Tooltip>

      <Tooltip title="Insert image" placement="bottom">
        <Button
          type="text"
          size="small"
          style={buttonStyle}
          icon={<PictureOutlined style={{ fontSize: "13px" }} />}
          onClick={() => markdownEditorCommands?.insertImage?.()}
          title="Insert image"
          aria-label="Insert image"
        />
      </Tooltip>
    </Space>
  );
};
