import React, { useState, useEffect } from 'react';
import useAppStore from '../store/store';
import { getCategories } from '../utils/sampleStorage/sampleStorage';
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
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isSaveModalOpen) {
            setCategories(getCategories());
            // Reset form when modal opens
            setName('');
            setDescription('');
            setCategory('General');
            setTags('');
            setError('');
        }
    }, [isSaveModalOpen]);

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
                description: description.trim() || undefined,
                category: category.trim(),
                tags: tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0),
                templateMarkdown,
                modelCto,
                data,
            };

            await saveCurrentAsSample(input);
            setSaveModalOpen(false);

            //Show success message
            console.log('Sample saved successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save sample');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (!isSaving) {
            setSaveModalOpen(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleClose();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleSave();
        }
    };

    if (!isSaveModalOpen) {
        return null;
    }

    return (
        <div className="save-modal-overlay" onClick={handleClose} onKeyDown={handleKeyDown}>
            <div className="save-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="save-modal-header">
                    <h2>Save to Custom Sample Library</h2>
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

                    <div className="save-modal-field">
                        <label htmlFor="sample-description">Description (optional)</label>
                        <textarea
                            id="sample-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this template is for..."
                            rows={3}
                            disabled={isSaving}
                        />
                    </div>

                    <div className="save-modal-field">
                        <label htmlFor="sample-category">Category</label>
                        <select
                            id="sample-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isSaving}
                        >
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="save-modal-field">
                        <label htmlFor="sample-tags">Tags (optional)</label>
                        <input
                            id="sample-tags"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="e.g., nda, legal, contract (comma-separated)"
                            disabled={isSaving}
                        />
                        <small>Separate multiple tags with commas</small>
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
                        onClick={handleSave}
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
