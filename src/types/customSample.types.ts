// Custom Sample Types
// Defines the structure for user-created custom template samples

// Represents a custom template sample created by the user
export interface CustomSample {
    // Unique identifier for the sample
    id: string;
    // User-defined name for the sample
    name: string;

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
}

// Storage structure for the sample library
export interface SampleLibrary {
    // Array of custom samples
    samples: CustomSample[];

    // Schema version for migration support
    version: number;
}

// Input data for creating a new custom sample
export interface CreateSampleInput {
    name: string;
    templateMarkdown: string;
    modelCto: string;
    data: string;
}

// Storage key for localStorage
export const CUSTOM_SAMPLES_STORAGE_KEY = 'accord-custom-samples';

// Current schema version
export const SAMPLE_LIBRARY_VERSION = 1;

// Maximum number of samples to store
export const MAX_SAMPLES = 50;
