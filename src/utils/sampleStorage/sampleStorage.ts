// Sample Storage Utility
// Handles localStorage operations for custom template samples

import { v4 as uuidv4 } from 'uuid';
import type {
    CustomSample,
    SampleLibrary,
    CreateSampleInput,
} from '../../types/customSample.types';
import {
    CUSTOM_SAMPLES_STORAGE_KEY,
    SAMPLE_LIBRARY_VERSION,
    MAX_SAMPLES,
} from '../../types/customSample.types';

// Initialize the sample library if it doesn't exist
const initializeLibrary = (): SampleLibrary => {
    return {
        samples: [],
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

// Save the sample library to localStorage
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
        templateMarkdown: input.templateMarkdown,
        modelCto: input.modelCto,
        data: input.data,
        createdAt: now,
        updatedAt: now,
    };

    library.samples.push(newSample);
    saveLibrary(library);

    return newSample;
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

// Validate sample input
const validateSampleInput = (input: CreateSampleInput): { isValid: boolean; errors: string[] } => {
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
