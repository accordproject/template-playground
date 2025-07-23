import React from 'react';
import { Input } from 'antd';
import useAppStore from '../../store/store';
import useUndoRedo from '../../components/useUndoRedo';
import { FaUndo, FaRedo } from 'react-icons/fa';

const { TextArea } = Input;

function TemplateLogic() {
  const textColor = useAppStore((state) => state.textColor);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const templateLogic = useAppStore((state) => state.templateLogic);
  const setTemplateLogic = useAppStore((state) => state.setTemplateLogic);
  const { value, setValue, undo, redo } = useUndoRedo(
    templateLogic,
    setTemplateLogic,
    setTemplateLogic
  );

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setValue(value);
    }
  };

  return (
    <div className="column" style={{ backgroundColor, padding: '16px' }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: '16px' }}>
        <h3 style={{ color: textColor }}>Template Logic</h3>
        <div>
          <FaUndo 
            onClick={undo} 
            title="Undo" 
            style={{ cursor: "pointer", color: textColor, marginRight: "8px" }} 
          />
          <FaRedo 
            onClick={redo} 
            title="Redo" 
            style={{ cursor: "pointer", color: textColor }} 
          />
        </div>
      </div>
      <p style={{ color: textColor, marginBottom: '16px' }}>
        TypeScript/JavaScript logic for template execution and business rules.
      </p>
      <TextArea
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.value)}
        placeholder="// Enter your template logic here...
// Example:
// function calculatePenalty(lateDays: number, penaltyRate: number): number {
//   return lateDays * penaltyRate;
// }"
        rows={20}
        style={{ 
          backgroundColor, 
          color: textColor, 
          borderColor: '#d9d9d9',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      />
    </div>
  );
}

export default TemplateLogic; 