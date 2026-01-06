import React from 'react';
import { resetChat } from '../ai-assistant/chatRelay';
import useAppStore from '../store/store';

interface AIErrorFallbackProps {
    error: Error;
    resetError: () => void;
}

/**
 * AIErrorFallback component displays a user-friendly error message when AI features encounter errors.
 * Provides options to retry or reset AI configuration.
 */
const AIErrorFallback: React.FC<AIErrorFallbackProps> = ({ error, resetError }) => {
    const { setAIConfig } = useAppStore();

    const handleRetry = () => {
        resetError();
    };

    const handleResetConfig = () => {
        // Clear AI configuration from localStorage
        localStorage.removeItem('aiProvider');
        localStorage.removeItem('aiModel');
        localStorage.removeItem('aiApiKey');
        localStorage.removeItem('aiCustomEndpoint');
        localStorage.removeItem('aiResMaxTokens');
        localStorage.removeItem('aiIncludeTemplateMark');
        localStorage.removeItem('aiIncludeConcertoModel');
        localStorage.removeItem('aiIncludeData');
        localStorage.removeItem('aiShowFullPrompt');
        localStorage.removeItem('aiEnableCodeSelectionMenu');
        localStorage.removeItem('aiEnableInlineSuggestions');

        // Clear AI configuration from store
        setAIConfig(null);

        // Reset chat state
        resetChat();

        // Reset error boundary
        resetError();
    };

    // Determine user-friendly error message based on error content
    const getUserFriendlyMessage = (error: Error): string => {
        const errorMessage = error.message.toLowerCase();

        // Network errors
        if (errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('unable to connect')) {
            return 'Unable to connect. Please check your internet connection.';
        }

        // API Key errors (401)
        if (errorMessage.includes('401') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('invalid api key') ||
            errorMessage.includes('authentication')) {
            return 'Invalid API key. Please check your configuration.';
        }

        // Rate limit errors (429)
        if (errorMessage.includes('429') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('too many requests')) {
            return 'Rate limit exceeded. Please try again in a few moments.';
        }

        // Server errors (500+)
        if (errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504') ||
            errorMessage.includes('service unavailable') ||
            errorMessage.includes('temporarily unavailable')) {
            return 'The AI service is temporarily unavailable. Please try again later.';
        }

        // Configuration errors
        if (errorMessage.includes('configure') ||
            errorMessage.includes('not configured')) {
            return 'AI Assistant is not configured. Please check your settings.';
        }

        // Default error message
        return 'Something went wrong with the AI Assistant. Please try again.';
    };

    const userFriendlyMessage = getUserFriendlyMessage(error);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            height: '100%',
            backgroundColor: 'var(--background-color, #f5f5f5)',
            color: 'var(--text-color, #333)',
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                backgroundColor: 'var(--card-background, white)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border-color, #e0e0e0)',
            }}>
                {/* Error Icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '16px',
                }}>
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff4d4f"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>

                {/* Error Title */}
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: 'var(--text-color, #333)',
                }}>
                    AI Assistant Error
                </h3>

                {/* User-friendly error message */}
                <p style={{
                    margin: '0 0 20px 0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    textAlign: 'center',
                    color: 'var(--text-secondary, #666)',
                }}>
                    {userFriendlyMessage}
                </p>

                {/* Technical details (collapsible) */}
                <details style={{
                    marginBottom: '20px',
                    fontSize: '12px',
                    color: 'var(--text-secondary, #666)',
                }}>
                    <summary style={{
                        cursor: 'pointer',
                        padding: '8px',
                        backgroundColor: 'var(--background-color, #f5f5f5)',
                        borderRadius: '4px',
                        userSelect: 'none',
                    }}>
                        Technical Details
                    </summary>
                    <pre style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--code-background, #f5f5f5)',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '11px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                    }}>
                        {error.toString()}
                    </pre>
                </details>

                {/* Action buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                }}>
                    <button
                        onClick={handleRetry}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: 'white',
                            backgroundColor: '#1890ff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#40a9ff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1890ff';
                        }}
                    >
                        Retry
                    </button>

                    <button
                        onClick={handleResetConfig}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#666',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--border-color, #d9d9d9)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#1890ff';
                            e.currentTarget.style.color = '#1890ff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color, #d9d9d9)';
                            e.currentTarget.style.color = '#666';
                        }}
                    >
                        Reset Configuration
                    </button>
                </div>

                {/* Helpful tips */}
                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    backgroundColor: 'var(--info-background, #e6f7ff)',
                    borderRadius: '4px',
                    border: '1px solid var(--info-border, #91d5ff)',
                }}>
                    <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--info-text, #0050b3)',
                    }}>
                        💡 Troubleshooting Tips:
                    </p>
                    <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary, #666)',
                    }}>
                        <li>Check your internet connection</li>
                        <li>Verify your API key is correct</li>
                        <li>Ensure you have sufficient API credits</li>
                        <li>Try refreshing the page if the issue persists</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default AIErrorFallback;
