import React, { useState, useCallback, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import ReactDOM from 'react-dom';
import { Popover, popoverClasses } from '../components/dialogs/Popover';
import {
  PRIMITIVE_TYPES,
  ACCORD_PROJECT_TYPES,
  getFriendlyTypeName,
  getFullTypeName,
} from '../constants/types';
import '../styles/nodeview.css';

export const TemplateFormulaNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const { elementType, codeContents } = node.attrs as {
    elementType?: string;
    codeContents?: string;
  };
  const [editing, setEditing] = useState(false);
  const [draftType, setDraftType] = useState(elementType ?? 'Double');
  const [draftCode, setDraftCode] = useState(codeContents ?? '');
  const anchorRef = useRef<HTMLSpanElement>(null);

  const openEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftType(elementType ?? 'Double');
    setDraftCode(codeContents ?? '');
    setEditing(true);
  }, [elementType, codeContents]);

  const save = useCallback(() => {
    updateAttributes({
      elementType: getFullTypeName(draftType),
      codeContents: draftCode,
    });
    setEditing(false);
  }, [draftType, draftCode, updateAttributes]);

  const cancel = useCallback(() => setEditing(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') cancel();
    // Don't submit on Enter — the textarea needs Enter for newlines
  }, [cancel]);

  const popover = editing && ReactDOM.createPortal(
    <Popover anchor={anchorRef.current} onClose={cancel} width={320}>
      <label className={popoverClasses.label}>Return type</label>
      <select value={getFriendlyTypeName(draftType)} onChange={(e) => setDraftType(e.target.value)} className={popoverClasses.select}>
        <optgroup label="Primitives">
          {PRIMITIVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </optgroup>
        <optgroup label="Accord Project">
          {Object.keys(ACCORD_PROJECT_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}
        </optgroup>
      </select>
      <label className={popoverClasses.label}>TypeScript expression</label>
      <textarea
        autoFocus
        value={draftCode}
        onChange={(e) => setDraftCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className={popoverClasses.textarea}
        rows={4}
        spellCheck={false}
        placeholder="e.g. data.price * data.quantity"
      />
      <div className={popoverClasses.buttonRow}>
        <button onClick={save} className={popoverClasses.saveBtn}>Save</button>
        <button onClick={cancel} className={popoverClasses.cancelBtn}>Cancel</button>
      </div>
    </Popover>,
    document.body
  );

  const friendlyType = getFriendlyTypeName(elementType ?? 'Double');
  const displayCode = codeContents && codeContents.length > 24 ? codeContents.slice(0, 24) + '…' : (codeContents || '');

  return (
    <NodeViewWrapper as="span">
      <span
        ref={anchorRef}
        onClick={openEdit}
        contentEditable={false}
        className="ap-badge ap-badge--formula"
        title={`Formula (${friendlyType}) — click to edit`}
      >
        <span className="ap-badge__sigil">ƒ</span>
        {codeContents && <span className="ap-badge__code-preview">{' '}{displayCode}</span>}
        {elementType && <em className="ap-badge__type">{' : '}{friendlyType}</em>}
      </span>
      {popover}
    </NodeViewWrapper>
  );
};
