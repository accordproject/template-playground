import React, { useRef, useState } from 'react';
import { MdSend, MdStop, MdArrowDropDown } from 'react-icons/md';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onStop: () => void;
    isLoading: boolean;
    isDarkMode: boolean;
    placeholder?: string;
}

const PRESETS = [
    { id: 'textToTemplate', label: 'Text to TemplateMark' },
    { id: 'createConcertoModel', label: 'Create Concerto Model' }
];

const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    onStop,
    isLoading,
    isDarkMode,
    placeholder = "Type your message..."
}) => {
    const [input, setInput] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            if (isLoading) return;
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput("");
        if (textareaRef.current) textareaRef.current.scrollTop = 0;
    };

    const handlePresetSelect = (presetId: string) => {
        setActivePreset(presetId);
        setIsDropdownOpen(false);
    };

    const inputContainerClass = `
    relative flex items-end gap-2 p-2 rounded-xl border transition-all duration-200
    ${isDarkMode
            ? 'bg-[#2b3655] border-gray-700 focus-within:border-[#19c6c7]'
            : 'bg-white border-gray-200 focus-within:border-[#19c6c7] shadow-sm'
        }
  `;

    const textareaClass = `
    flex-1 max-h-32 min-h-[44px] py-3 px-2 bg-transparent border-none focus:ring-0 resize-none text-sm outline-none shadow-none
    ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-400'}
  `;

    return (
        <div className="flex flex-col gap-2">
            {activePreset && (
                <div className="flex items-center gap-2 self-start animate-fade-in">
                    <span className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${isDarkMode ? 'bg-[#19c6c7]/20 text-[#19c6c7]' : 'bg-[#19c6c7]/10 text-teal-700'}`}>
                        <span className="font-medium">{PRESETS.find(p => p.id === activePreset)?.label}</span>
                        <button onClick={() => setActivePreset(null)} className="hover:text-red-500 ml-1 border-none bg-transparent cursor-pointer">×</button>
                    </span>
                </div>
            )}

            <div className={inputContainerClass}>
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`p-2 rounded-lg border-none shadow-none bg-transparent transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        title="Prompt Presets"
                    >
                        <MdArrowDropDown size={20} />
                    </button>

                    {isDropdownOpen && (
                        <div className={`absolute bottom-full left-0 mb-2 w-48 rounded-lg shadow-xl border overflow-hidden z-10 ${isDarkMode ? 'bg-[#1b2540] border-gray-700' : 'bg-white border-gray-100'}`}>
                            {PRESETS.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetSelect(preset.id)}
                                    className={`w-full text-left px-4 py-2 text-sm border-none bg-transparent transition-colors ${isDarkMode ? 'text-gray-200 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activePreset ? `Enter details for ${PRESETS.find(p => p.id === activePreset)?.label ?? ''}...` : placeholder}
                    className={textareaClass}
                    rows={1}
                />

                {isLoading ? (
                    <button
                        onClick={onStop}
                        className="p-2.5 rounded-lg border-none bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm"
                        title="Stop generating"
                    >
                        <MdStop size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`p-2.5 rounded-lg border-none transition-all shadow-sm ${input.trim()
                            ? 'bg-[#19c6c7] text-[#050c40] hover:brightness-110 transform hover:scale-105'
                            : isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        <MdSend size={18} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ChatInput;
