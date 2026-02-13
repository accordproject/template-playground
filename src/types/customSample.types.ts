// Custom Sample Types
// Defines the structure for user-created custom template samples

// Represents a custom template sample created by the user
export interface CustomSample {
    // Unique identifier for the sample
    id: string;
    // User-defined name for the sample
    name: string;
    // Optional description of what this sample does
    description?: string;
    // Tags for searching and organizing samples
    tags: string[];
    // Category for grouping samples
    category: string;

    // The TemplateMark content
    templateMarkdown: string;

    // The Concerto model definition
    modelCto: string;

    // The JSON data as a string
    data: string;

    // Timestamp when the sample was created
    createdAt: number;

    // Timestamp when the sample was last modified
    updatedAt: number;

    // Whether this sample was imported from a file
    isImported: boolean;

    // Original file name if imported
    originalFileName?: string;
}

// Storage structure for the sample library
export interface SampleLibrary {
    // Array of custom samples
    samples: CustomSample[];

    // User-defined categories
    categories: string[];

    // Schema version for migration support
    version: number;
}

// Input data for creating a new custom sample
export interface CreateSampleInput {
    name: string;
    description?: string;
    tags?: string[];
    category?: string;
    templateMarkdown: string;
    modelCto: string;
    data: string;
}

// Input data for updating an existing custom sample
export interface UpdateSampleInput {
    name?: string;
    description?: string;
    tags?: string[];
    category?: string;
    templateMarkdown?: string;
    modelCto?: string;
    data?: string;
}

// Validation result for sample operations
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Default categories for organizing samples
export const DEFAULT_CATEGORIES = [
    'Legal',
    'Financial',
    'Employment',
    'General',
    'Other'
] as const;

// Storage key for localStorage
export const CUSTOM_SAMPLES_STORAGE_KEY = 'accord-custom-samples';

// Current schema version
export const SAMPLE_LIBRARY_VERSION = 1;

// Maximum number of samples to store
export const MAX_SAMPLES = 50;
