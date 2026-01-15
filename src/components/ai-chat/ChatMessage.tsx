import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/components/AIAssistant.types';

interface ChatMessageProps {
    message: Message;
    isDarkMode: boolean;
    isThinking?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
    message,
    isDarkMode,
    isThinking = false
}) => {
    const isUser = message.role === 'user';
    const isError = message.content.startsWith('[ERROR]');

    const displayContent = isError ? message.content.replace(/^\[ERROR\]\s*/, '') : message.content;

    const containerClass = `flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`;

    const bubbleClass = `
    max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm
    ${isUser
            ? 'bg-[#19c6c7] text-[#050c40] rounded-br-none'
            : isDarkMode
                ? 'bg-[#2b3655] text-white rounded-bl-none border border-gray-700'
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-md'
        }
    ${isError ? 'bg-red-50 border-red-200 text-red-800' : ''}
  `;

    const codeStyle = isDarkMode
        ? 'bg-[#1b2540] text-gray-200 rounded p-1 text-xs'
        : 'bg-gray-100 text-red-500 rounded p-1 text-xs';

    const preStyle = isDarkMode
        ? 'bg-[#1b2540] p-3 rounded-lg overflow-x-auto my-2 border border-gray-700'
        : 'bg-gray-800 text-white p-3 rounded-lg overflow-x-auto my-2';

    return (
        <div className={containerClass}>
            <div className={bubbleClass}>
                {!isUser && (
                    <div className="text-xs opacity-50 mb-1 font-bold">
                        Assistant
                    </div>
                )}

                <div className="prose prose-sm max-w-none break-words">
                    <ReactMarkdown
                        components={{
                            code: ({ children }) => {
                                return <code className={codeStyle}>{children}</code>;
                            },
                            pre: ({ children }) => <pre className={preStyle}>{children}</pre>
                        }}
                    >
                        {displayContent}
                    </ReactMarkdown>
                </div>

                {isThinking && (
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
