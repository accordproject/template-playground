import React, { useState } from 'react';
import useAppStore from '../store/store';
import type { CreateSampleInput } from '../types/customSample.types';
import './SaveSampleModal.css';

const SaveSampleModal: React.FC = () => {
    const {
        isSaveModalOpen,
        setSaveModalOpen,
        saveCurrentAsSample,
        templateMarkdown,
        modelCto,
        data,
    } = useAppStore();

    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            setError('Sample name is required');
            return;
        }

        if (name.length > 100) {
            setError('Sample name must be less than 100 characters');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const input: CreateSampleInput = {
                name: name.trim(),
                templateMarkdown,
                modelCto,
                data,
            };

            await saveCurrentAsSample(input);
            setSaveModalOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save sample');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (!isSaving) {
            setSaveModalOpen(false);
            setName('');
            setError('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            void handleSave();
        }
    };

    if (!isSaveModalOpen) {
        return null;
    }

    return (
        <div className="save-modal-overlay" onClick={handleClose} onKeyDown={handleKeyDown}>
            <div className="save-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="save-modal-header">
                    <h2>Save Current Template</h2>
                    <button
                        className="save-modal-close"
                        onClick={handleClose}
                        disabled={isSaving}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="save-modal-body">
                    {error && (
                        <div className="save-modal-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="save-modal-field">
                        <label htmlFor="sample-name">
                            Sample Name <span className="required">*</span>
                        </label>
                        <input
                            id="sample-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., My Contract Template"
                            maxLength={100}
                            disabled={isSaving}
                            autoFocus
                        />
                        <span className="char-count">{name.length}/100</span>
                    </div>
                </div>

                <div className="save-modal-footer">
                    <button
                        className="save-modal-button secondary"
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        className="save-modal-button primary"
                        onClick={() => void handleSave()}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? 'Saving...' : 'Save Sample'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveSampleModal;
