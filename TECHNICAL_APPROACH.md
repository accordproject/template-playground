# Browser Template Logic Execution - Technical Approach

## Problem
Template Playground runs in the browser. Users want to write TypeScript logic 
in templates. But TypeScript doesn't run natively in browsers.

## Solution Architecture

### 1. Parse Template Logic
Input: `{{#if amount > 1000}} Discount {{/if}}`
Parse into: JavaScript AST (Abstract Syntax Tree)

### 2. Transform to Browser Code
Use Vite's esbuild to convert TypeScript → Browser-compatible JavaScript

### 3. Execute in Sandbox
Use Web Worker to execute code isolated from main thread

### 4. Return Result
Output the evaluated template with logic applied

## Example Flow

```
User Input Template
     ↓
Parser (handlebars syntax)
     ↓
TypeScript AST
     ↓
Vite Transform (esbuild)
     ↓
Browser JavaScript
     ↓
Web Worker Execution
     ↓
Template Output
```

## Libraries Needed
- `@babel/parser` - Parse JavaScript/TypeScript
- `@babel/traverse` - Navigate AST
- `esbuild` - Transform code (Vite uses this)
- Web Workers API (built-in)
