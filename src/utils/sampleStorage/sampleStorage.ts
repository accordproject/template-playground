// Sample Storage Utility
// Handles localStorage operations for custom template samples

import { v4 as uuidv4 } from 'uuid';
import type {
    CustomSample,
    SampleLibrary,
    CreateSampleInput,
    UpdateSampleInput,
    ValidationResult,
} from '../../types/customSample.types';
import {
    CUSTOM_SAMPLES_STORAGE_KEY,
    SAMPLE_LIBRARY_VERSION,
    MAX_SAMPLES,
    DEFAULT_CATEGORIES,
} from '../../types/customSample.types';

// Initialize the sample library if it doesn't exist
const initializeLibrary = (): SampleLibrary => {
    return {
        samples: [],
        categories: [...DEFAULT_CATEGORIES],
        version: SAMPLE_LIBRARY_VERSION,
    };
};

// Get sample library from localStorage
export const getLibrary = (): SampleLibrary => {
    try {
        const stored = localStorage.getItem(CUSTOM_SAMPLES_STORAGE_KEY);
        if (!stored) {
            return initializeLibrary();
        }

        const library = JSON.parse(stored) as SampleLibrary;

        // Validate version and structure
        if (!library.version || library.version !== SAMPLE_LIBRARY_VERSION) {
            console.warn('Sample library version mismatch, initializing new library');
            return initializeLibrary();
        }

        return library;
    } catch (error) {
        console.error('Error loading sample library:', error);
        return initializeLibrary();
    }
};

// Save the sample lbrary to localStorage
const saveLibrary = (library: SampleLibrary): void => {
    try {
        localStorage.setItem(CUSTOM_SAMPLES_STORAGE_KEY, JSON.stringify(library));
    } catch (error) {
        console.error('Error saving sample library:', error);
        throw new Error('Failed to save sample library. Storage quota may be exceeded.');
    }
};

// Get all custom samples
export const getAllSamples = (): CustomSample[] => {
    const library = getLibrary();
    return library.samples.sort((a, b) => b.updatedAt - a.updatedAt);
};

// Get a single sample by ID
export const getSampleById = (id: string): CustomSample | undefined => {
    const library = getLibrary();
    return library.samples.find((sample) => sample.id === id);
};

// Create a new custom sample
export const createSample = (input: CreateSampleInput): CustomSample => {
    const library = getLibrary();

    // Check if we've hit the maximum number of samples
    if (library.samples.length >= MAX_SAMPLES) {
        throw new Error(`Maximum number of samples (${MAX_SAMPLES}) reached. Please delete some samples.`);
    }

    // Validate input
    const validation = validateSampleInput(input);
    if (!validation.isValid) {
        throw new Error(`Invalid sample data: ${validation.errors.join(', ')}`);
    }

    const now = Date.now();
    const newSample: CustomSample = {
        id: uuidv4(),
        name: input.name.trim(),
        description: input.description?.trim(),
        tags: input.tags?.map((tag) => tag.trim().toLowerCase()) || [],
        category: input.category?.trim() || 'General',
        templateMarkdown: input.templateMarkdown,
        modelCto: input.modelCto,
        data: input.data,
        createdAt: now,
        updatedAt: now,
        isImported: false,
    };

    library.samples.push(newSample);
    saveLibrary(library);

    return newSample;
};

// Update an existing custom sample
export const updateSample = (id: string, updates: UpdateSampleInput): CustomSample => {
    const library = getLibrary();
    const sampleIndex = library.samples.findIndex((s) => s.id === id);

    if (sampleIndex === -1) {
        throw new Error(`Sample with id ${id} not found`);
    }

    const existingSample = library.samples[sampleIndex];
    const updatedSample: CustomSample = {
        ...existingSample,
        ...updates,
        tags: updates.tags?.map((tag) => tag.trim().toLowerCase()) || existingSample.tags,
        updatedAt: Date.now(),
    };

    library.samples[sampleIndex] = updatedSample;
    saveLibrary(library);

    return updatedSample;
};

// Delete a custom sample
export const deleteSample = (id: string): void => {
    const library = getLibrary();
    const initialLength = library.samples.length;

    library.samples = library.samples.filter((sample) => sample.id !== id);

    if (library.samples.length === initialLength) {
        throw new Error(`Sample with id ${id} not found`);
    }

    saveLibrary(library);
};

// Search samples by name, description, or tags
export const searchSamples = (query: string): CustomSample[] => {
    const library = getLibrary();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
        return library.samples;
    }

    return library.samples.filter((sample) => {
        const nameMatch = sample.name.toLowerCase().includes(lowerQuery);
        const descMatch = sample.description?.toLowerCase().includes(lowerQuery);
        const tagMatch = sample.tags.some((tag) => tag.includes(lowerQuery));

        return nameMatch || descMatch || tagMatch;
    });
};

// Get samples by category
export const getSamplesByCategory = (category: string): CustomSample[] => {
    const library = getLibrary();
    return library.samples.filter((sample) => sample.category === category);
};

// Add a new category
export const addCategory = (category: string): void => {
    const library = getLibrary();
    const trimmedCategory = category.trim();

    if (!trimmedCategory) {
        throw new Error('Category name cannot be empty');
    }

    if (library.categories.includes(trimmedCategory)) {
        throw new Error('Category already exists');
    }

    library.categories.push(trimmedCategory);
    saveLibrary(library);
};

// Get all categories
export const getCategories = (): string[] => {
    const library = getLibrary();
    return [...library.categories];
};

// Export a sample as a JSON blob
export const exportSample = (id: string): Blob => {
    const sample = getSampleById(id);
    if (!sample) {
        throw new Error(`Sample with id ${id} not found`);
    }

    const exportData = {
        name: sample.name,
        description: sample.description,
        tags: sample.tags,
        category: sample.category,
        templateMarkdown: sample.templateMarkdown,
        modelCto: sample.modelCto,
        data: sample.data,
        exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
};

// Export all samples as a JSON blob
export const exportAllSamples = (): Blob => {
    const library = getLibrary();

    const exportData = {
        samples: library.samples.map((sample) => ({
            name: sample.name,
            description: sample.description,
            tags: sample.tags,
            category: sample.category,
            templateMarkdown: sample.templateMarkdown,
            modelCto: sample.modelCto,
            data: sample.data,
        })),
        exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Blob([json], { type: 'application/json' });
};

// Import a sample from JSON
export const importSample = (jsonString: string, fileName?: string): CustomSample => {
    try {
        const data = JSON.parse(jsonString) as Partial<CreateSampleInput>;

        if (!data.name || !data.templateMarkdown || !data.modelCto || !data.data) {
            throw new Error('Invalid sample format: missing required fields');
        }

        const input: CreateSampleInput = {
            name: data.name,
            description: data.description,
            tags: data.tags,
            category: data.category,
            templateMarkdown: data.templateMarkdown,
            modelCto: data.modelCto,
            data: data.data,
        };

        const sample = createSample(input);

        // Mark as imported and store original filename
        const library = getLibrary();
        const sampleIndex = library.samples.findIndex((s) => s.id === sample.id);
        if (sampleIndex !== -1) {
            library.samples[sampleIndex].isImported = true;
            library.samples[sampleIndex].originalFileName = fileName;
            saveLibrary(library);
        }

        return sample;
    } catch (error) {
        console.error('Error importing sample:', error);
        throw new Error('Failed to import sample. Invalid file format.');
    }
};

// Validate sample input
const validateSampleInput = (input: CreateSampleInput): ValidationResult => {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length === 0) {
        errors.push('Sample name is required');
    }

    if (input.name && input.name.length > 100) {
        errors.push('Sample name must be less than 100 characters');
    }

    if (!input.templateMarkdown || input.templateMarkdown.trim().length === 0) {
        errors.push('Template markdown is required');
    }

    if (!input.modelCto || input.modelCto.trim().length === 0) {
        errors.push('Concerto model is required');
    }

    if (!input.data || input.data.trim().length === 0) {
        errors.push('Data is required');
    }

    // Validate JSON data format
    if (input.data) {
        try {
            JSON.parse(input.data);
        } catch {
            errors.push('Data must be valid JSON');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Clear all custom samples (use with caution!)
export const clearAllSamples = (): void => {
    const library = initializeLibrary();
    saveLibrary(library);
};

// Get storage usage statistics
export const getStorageStats = (): { count: number; maxCount: number; usagePercent: number } => {
    const library = getLibrary();
    return {
        count: library.samples.length,
        maxCount: MAX_SAMPLES,
        usagePercent: (library.samples.length / MAX_SAMPLES) * 100,
    };
};
