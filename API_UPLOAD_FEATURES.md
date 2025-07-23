# API Upload Features

This document describes the new API upload functionality added to the Accord Protocol Template Playground.

## Overview

The template playground now includes comprehensive support for uploading templates and creating agreements using the Accord Protocol API format as defined in the [OpenAPI specification](https://raw.githubusercontent.com/accordproject/apap/refs/heads/main/openapi.json).

## New Components

### 1. Template Metadata Editor

**Location**: `src/editors/editorsContainer/TemplateMetadata.tsx`

A form-based editor that allows users to configure all template metadata fields required by the API:

- **Basic Properties**:
  - Author
  - Display Name
  - Version
  - Description
  - License (dropdown with common licenses)
  - Keywords (tag-based input)

- **Runtime Metadata**:
  - Runtime (TypeScript/JavaScript/ES2015)
  - Template Type (Clause/Contract/Template)
  - Cicero Version

### 2. Template Logic Editor

**Location**: `src/editors/editorsContainer/TemplateLogic.tsx`

A large text area editor for writing TypeScript/JavaScript logic code with:
- Syntax highlighting
- Undo/Redo functionality
- Monospace font for code readability

### 3. API Upload Component

**Location**: `src/components/ApiUpload.tsx`

A comprehensive upload interface that provides:

- **API Configuration**: Configurable API base URL
- **Template Upload**: Upload template to API with validation
- **Agreement Creation**: Create agreements from uploaded templates
- **Template Download**: Download template as JSON file
- **Preview Modal**: View formatted template JSON before upload

## API Integration

### Template Format

The system automatically formats templates according to the Accord Protocol API specification:

```json
{
  "uri": "resource:org.accordproject.protocol@1.0.0.Template#template-name",
  "author": "Author Name",
  "displayName": "Template Display Name",
  "version": "1.0.0",
  "description": "Template description",
  "license": "Apache-2",
  "keywords": ["keyword1", "keyword2"],
  "metadata": {
    "$class": "org.accordproject.protocol@1.0.0.TemplateMetadata",
    "runtime": "typescript",
    "template": "clause",
    "cicero": "0.25.x"
  },
  "logo": null,
  "templateModel": {
    "$class": "org.accordproject.protocol@1.0.0.TemplateModel",
    "typeName": "templatename",
    "model": {
      "$class": "org.accordproject.protocol@1.0.0.CtoModel",
      "ctoFiles": [
        {
          "contents": "// Concerto model content",
          "filename": "model.cto"
        }
      ]
    }
  },
  "text": {
    "$class": "org.accordproject.protocol@1.0.0.Text",
    "templateText": "TemplateMark content"
  },
  "logic": "// Template logic code",
  "sampleRequest": null
}
```

### API Endpoints

The system integrates with the following API endpoints:

- `POST /templates` - Upload template
- `POST /agreements` - Create agreement from template
- `GET /templates` - List templates
- `GET /agreements` - List agreements

## Usage

### 1. Configure Template Metadata

1. Open the "Template Metadata" panel
2. Fill in required fields (Author and Display Name are mandatory)
3. Configure runtime settings as needed

### 2. Write Template Logic (Optional)

1. Open the "Template Logic" panel
2. Write TypeScript/JavaScript code for template execution
3. Use undo/redo for code editing

### 3. Upload to API

1. Open the "API Upload" panel
2. Configure the API base URL
3. Click "Upload Template to API"
4. Review the generated JSON in the preview modal
5. Optionally create agreements from the uploaded template

### 4. Download Template

- Use the "Download Template JSON" button to save the template locally

## State Management

The new features are integrated into the existing Zustand store with:

- `templateMetadata`: Template metadata state
- `templateLogic`: Template logic code
- `setTemplateMetadata()`: Update metadata
- `setTemplateLogic()`: Update logic code

## Data Persistence

Template metadata and logic are included in:
- Shareable links (compressed data)
- Sample loading
- State restoration

## Error Handling

The system includes comprehensive error handling:
- Validation of required fields
- API error responses
- Network connectivity issues
- JSON parsing errors

## Future Enhancements

Potential improvements:
- Template versioning
- Batch upload capabilities
- Template marketplace integration
- Advanced validation rules
- Template testing framework 