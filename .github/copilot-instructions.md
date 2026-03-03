# GitHub Copilot Instructions for Template Playground

This repository is the **Accord Project Template Playground** - a web-based IDE for creating, testing, and sharing Accord Project templates that combine TemplateMark (natural language), Concerto (data models), and TypeScript (business logic).

## Project Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript (strict mode enabled)
- **Build Tool**: Vite 4.5+ with 8GB memory allocation (`NODE_OPTIONS=--max-old-space-size=8192`)
- **State Management**: Zustand with immer middleware (single store pattern)
- **UI Libraries**: 
  - Ant Design 5.7+ (primary UI framework)
  - TailwindCSS 3.4+ with scoped preflight (`.twp` class, isolated from Ant Design)
  - Styled Components 6.1+ for dynamic theming
- **Editors**: Monaco Editor with custom Concerto language definition
- **Testing**: 
  - Unit: Vitest with jsdom and Testing Library
  - E2E: Playwright with 30s timeouts and localStorage presets
- **Routing**: React Router v6 with hash-based routing for shareable links
- **AI Integrations**: OpenAI, Anthropic, Google Genai, Mistral AI SDKs
- **Core Dependencies**: @accordproject/concerto-core, @accordproject/template-engine, @accordproject/markdown-template, @accordproject/markdown-transform

### File Structure
```
src/
  ├── components/        # Reusable React components
  ├── pages/            # Page-level route components
  ├── store/            # Zustand state management
  ├── types/            # TypeScript type definitions
  ├── utils/            # Pure utility functions
  ├── ai-assistant/     # AI provider integrations
  ├── editors/          # Monaco editor components
  ├── samples/          # Template examples (MODEL, DATA, TEMPLATE exports)
  └── tests/            # Unit tests (mirrors src structure)
e2e/                    # Playwright end-to-end tests
public/                 # Static assets and content
```

---

## Critical Requirements

### 1. Commit Hygiene (BLOCKING)

**Every commit MUST include Developer Certificate of Origin (DCO) sign-off:**
```bash
git commit --signoff -m "feat(scope): description"
```

**Commit Message Format (REQUIRED):**
Follow [Accord Project commit conventions](https://github.com/accordproject/techdocs/blob/master/DEVELOPERS.md#commit-message-format):
```
type(scope): description

[optional body]

Signed-off-by: Your Name <your.email@example.com>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`  
**Scopes**: Component or area name (e.g., `ConcertoEditor`, `UI`, `CI`, `sharable`, `AI`)

**Examples from merged PRs:**
- ✅ `feat(ConcertoEditor): Added Syntax Highlighting`
- ✅ `fix(sharable): agreementData preview screen bug fixed`
- ✅ `chore(CI): fix build and deployment issues`
- ❌ `update readme` (missing type, scope, and DCO)
- ❌ `Add new feature` (missing scope and DCO)

**Reminder**: Missing DCO sign-off will block PR merging. Configure `git config alias.c 'commit --signoff'` for convenience.

---

### 2. Testing Requirements (VITAL)

**All user-facing features MUST have test coverage before merging.**

#### Unit Tests (Vitest)
- **Location**: `src/tests/` (mirrors source structure)
- **Setup**: Import `@testing-library/jest-dom` for matchers
- **Conventions**:
  - Wrap components using `useNavigate` in `<MemoryRouter>`
  - Mock `window.matchMedia` for responsive components
  - Mock `HTMLCanvasElement.getContext` for lottie-web animations
  - Use Zustand `getState()` for store assertions

**Example Pattern:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState(initialState);
  });

  it('should render correctly', () => {
    render(
      <MemoryRouter>
        <ComponentName />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
```

#### E2E Tests (Playwright)
- **Location**: `e2e/` directory
- **Conventions**:
  - Set `localStorage.setItem('hasVisited', 'true')` to skip tour
  - Wait for `.app-spinner-container` to be hidden (30s timeout)
  - Use semantic selectors: `getByRole`, `getByLabel`, `getByText`
  - Sort test files by feature area

**Example Pattern:**
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-spinner-container')).toBeHidden({ timeout: 30000 });
  });

  test('should complete user workflow', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Generate' });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

**PR Review Pattern**: PRs lacking tests for vital features will be asked to add coverage (see PR #60, #90).

---

## Code Style and TypeScript Conventions

### TypeScript Strictness
- **Strict mode enabled** - no `any` types without justification
- **Type all function signatures** including return types
- **Prefer interfaces over types** for object shapes
- **Use `readonly` for immutable data**
- **Exception**: `@typescript-eslint/no-non-null-assertion` is off (use `!` sparingly with justification)

### Import Ordering
```typescript
// 1. React and external libraries
import { useEffect, useState } from "react";
import { App as AntdApp, Layout } from "antd";

// 2. Local components
import Navbar from "./components/Navbar";
import SampleDropdown from "./components/SampleDropdown";

// 3. Types and interfaces
import type { AIConfig, Message } from "./types";

// 4. Utilities and hooks
import useAppStore from "./store/store";
import { compressData, decompressData } from "./utils/compression";

// 5. Styles
import "./styles/App.css";
```

### Naming Conventions
- **Components**: PascalCase (e.g., `SampleDropdown.tsx`, `AgreementHtml.tsx`)
- **Utilities**: camelCase (e.g., `chatRelay.ts`, `autocompletion.ts`)
- **Types/Interfaces**: PascalCase, optionally prefixed with `I` (e.g., `IMessage`, `AIConfig`)
- **Constants**: UPPER_SNAKE_CASE for sample exports (e.g., `MODEL`, `TEMPLATE`, `DATA`)
- **Files**: kebab-case for utilities, PascalCase for components

### JSX Conventions
- **Strings**: Use double quotes in JSX attributes: `<Button text="Submit" />`
- **Components**: Arrow functions preferred: `const Component = (): JSX.Element => { ... }`
- **Props**: Destructure at parameter level with inline types:
  ```typescript
  const Button = ({ label, onClick }: { label: string; onClick: () => void }): JSX.Element => {
    return <button onClick={onClick}>{label}</button>;
  };
  ```
- **Spacing**: Consistent spacing around JSX attributes and braces

---

## State Management Patterns (Zustand)

### Store Structure
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // State properties
  templateMarkdown: string;
  modelCto: string;
  data: string;
  
  // Actions
  setTemplateMarkdown: (value: string) => void;
  setModelCto: (value: string) => void;
  rebuild: () => Promise<void>;
}

const useAppStore = create<AppState>()(
  devtools(
    immer((set) => ({
      // Initial state
      templateMarkdown: '',
      modelCto: '',
      data: '',
      
      // Actions using immer draft
      setTemplateMarkdown: (value) => set((state) => {
        state.templateMarkdown = value;
      }),
      
      rebuild: async () => {
        // Async operations
      }
    }))
  )
);

export default useAppStore;
```

### Critical Store Patterns
1. **Shareable Link State**: `agreementHtml` must be included in shareable link compression (PR #90 issue)
2. **Debouncing**: `rebuild()` is debounced to 500ms - avoid calling directly in tight loops
3. **Error State**: Prefix errors with context: `"c:"` for Concerto, `"t:"` for Template
4. **Immutable Updates**: Use immer's draft API, don't mutate state directly
5. **Theme Management**: `backgroundColor` and `textColor` stored for dynamic Ant Design theming

---

## UI/UX Guidelines

### Accord Project Branding
- **Typography**: Rubik font family (defined in theme)
- **Primary Color**: #19C6C8 (Accord Project teal/blue)
- **Logo**: `public/APLogo.png` for navbar and footer
- **External Links**: Link to Accord Project docs, Discord, GitHub

### Ant Design Integration
- **Theme**: Override via `ConfigProvider` with Zustand theme values
- **Responsive**: Use Ant Grid system (`<Row>`, `<Col>`) with breakpoints
- **Dark Mode**: Support both light and dark themes with dynamic style injection
- **Components**: Prefer Ant components over custom HTML elements

### TailwindCSS Scoped Preflight
- **Isolation**: Wrap Tailwind-styled components with `.twp` class
- **Exception**: Use `.no-twp` to exclude specific elements
- **Reason**: Prevents conflicts with Ant Design's global styles
- **Example**:
  ```tsx
  <div className="twp">
    <div className="p-4 text-blue-500">Tailwind styles here</div>
  </div>
  ```

### Responsive Design
- **Mobile-first**: Design for small screens, enhance for desktop
- **Breakpoints**: Use Ant Design breakpoints (`xs`, `sm`, `md`, `lg`, `xl`)
- **Testing**: Verify responsive behavior in Playwright tests
- **Hover Effects**: Precise hover states for interactive elements (PR #30, #130 feedback)

---

## Performance Optimization

### Memory Management
- **Build**: Requires `NODE_OPTIONS=--max-old-space-size=8192` due to large Accord Project bundles
- **Monaco Editor**: Lazy load language definitions to reduce initial bundle
- **Sample Loading**: Load sample templates on demand, not upfront

### Debouncing and Throttling
- **Rebuild Function**: Debounced to 500ms using `ts-debounce`
- **Editor Changes**: Debounce onChange handlers to avoid excessive re-renders
- **AI Requests**: Implement abort controllers for streaming responses

### Code Splitting
- **Dynamic Imports**: Use React.lazy for route-level code splitting
- **Suspense**: Wrap lazy components with `<Suspense fallback={<Spin />}>`

---

## Accord Project Specific Patterns

### Concerto Models
- **File Extension**: `.cto` files in Monaco Editor
- **Syntax Highlighting**: Custom language definition registered with Monaco
- **Error Markers**: Show Concerto validation errors in editor gutter
- **Namespace**: Models must declare a namespace (e.g., `namespace org.accordproject`)

### TemplateMark Templates
- **Syntax**: Natural language with `{{variable}}` placeholders and `{{#blocks}}`
- **Context Scoping**: Known issue with `{{#if}}` and `{{#optional}}` blocks losing parent context (Issue #2)
- **Validation**: Errors prefixed with `"t:"` in store
- **Line Wrapping**: Toggle available for long template lines

### Template Engine Integration
- **Rebuild Flow**: Parse Concerto → Load data → Execute template → Generate agreementHtml
- **Error Handling**: Catch and display errors at each step with context
- **Sample Structure**: Each sample exports `NAME`, `MODEL`, `DATA`, `TEMPLATE`

### Sample Template Pattern
```typescript
// src/samples/my-template.ts
export const NAME = "My Template";

export const MODEL = `namespace org.example
concept Person {
  o String name
}`;

export const DATA = `{
  "$class": "org.example.Person",
  "name": "Alice"
}`;

export const TEMPLATE = `Hello {{name}}!`;
```
**Registration**: Add to `src/samples/index.ts` array.

---

## AI Assistant Features

### Provider Integration
- **Supported**: OpenAI, Anthropic, Google Genai, Mistral AI
- **Persistence**: API keys and config stored in localStorage (never committed)
- **Streaming**: Use abort controllers for cancellable requests
- **Context**: Include template, model, and data in AI prompts for better suggestions

### Security
- **API Keys**: Never log or expose in error messages
- **CORS**: Custom endpoints must support CORS for browser requests
- **Validation**: Validate AI responses before applying to editors

---

## Common Pitfalls and Anti-Patterns

### Build Issues (PR #70)
- ❌ **Don't**: Use platform-specific commands (`SET` on Windows, `export` on Unix)
- ✅ **Do**: Use `cross-env` for environment variables in package.json scripts

### State Management (PR #90)
- ❌ **Don't**: Forget to include `agreementHtml` in shareable links
- ✅ **Do**: Compress entire state including generated output for preview

### Testing (PR #60)
- ❌ **Don't**: Ship features without test coverage
- ✅ **Do**: Write unit tests for logic, E2E tests for user workflows

### Commit Messages (All PRs)
- ❌ **Don't**: Merge without DCO sign-off
- ✅ **Do**: Use `git commit --signoff` on every commit

### TypeScript (Ongoing)
- ❌ **Don't**: Use `any` type without a strong justification
- ✅ **Do**: Define proper interfaces for complex objects

### Monaco Editor
- ❌ **Don't**: Register language definitions multiple times
- ✅ **Do**: Check if language is registered before defining

### Shareable Links
- ❌ **Don't**: Use query parameters (legacy approach)
- ✅ **Do**: Use hash-based routing with LZ-String compression

---

## Security Considerations

### User Input
- **Validation**: Validate all user input before processing with Template Engine
- **Sanitization**: Sanitize HTML output from template generation (XSS prevention)
- **API Keys**: Store securely in localStorage, never in URLs or logs

### Dependencies
- **Audit**: Run `npm audit` regularly for vulnerability scanning
- **Updates**: Keep Accord Project dependencies in sync with latest stable versions
- **Snyk**: PRs from snyk-bot for dependency updates are expected and should be reviewed

---

## CI/CD and Deployment

### GitHub Actions
- **Node Version**: 20.x (LTS)
- **Timeout**: 30 minutes for full workflow (build + test + e2e)
- **Sequential**: Workflows run build → test → e2e in order
- **Deployment**: Automatic to AWS S3 + CloudFront on `main` branch merges

### Build Requirements
- **Memory**: 8GB allocation via `NODE_OPTIONS`
- **Cross-Platform**: All scripts must work on Windows, macOS, and Linux
- **Environment**: `.env` file not committed (use `.env.example` for documentation)

---

## Code Review Expectations

### For Contributors
- **DCO Sign-off**: Every commit must be signed
- **Tests**: Vital features must have unit and/or E2E tests
- **Commit Format**: Follow Accord Project conventions
- **Description**: Explain the "why" in PR description, not just the "what"
- **Responsiveness**: Address review feedback promptly

### For Reviewers
- **Check DCO**: Verify all commits are signed
- **Run Tests**: Ensure `npm test` and `npm run test:e2e` pass
- **Test Coverage**: Confirm new features have test coverage
- **UI/UX**: Check responsive behavior and Accord Project branding
- **Performance**: Look for optimization opportunities (debouncing, memoization)

---

## Learning Resources

- [Accord Project Documentation](https://docs.accordproject.org/)
- [Accord Project Discord Community](https://discord.com/invite/Zm99SKhhtA)
- [Template Playground Repository](https://github.com/accordproject/template-playground)
- [Concerto Modeling Language](https://github.com/accordproject/concerto)
- [TemplateMark Specification](https://github.com/accordproject/markdown-transform)

---

## Summary Checklist

When contributing code, ensure:
- [ ] DCO sign-off on all commits (`--signoff`)
- [ ] Commit message follows `type(scope): description` format
- [ ] Tests added for new features (unit and/or E2E)
- [ ] TypeScript strict mode satisfied (no `any` without justification)
- [ ] Ant Design theme compatibility checked
- [ ] Responsive design tested on mobile and desktop
- [ ] Error handling implemented with context prefixes
- [ ] State management uses Zustand immer pattern
- [ ] Performance considerations applied (debouncing, memoization)
- [ ] Accord Project branding and conventions followed

---

**Remember**: GitHub Copilot is a tool to enhance your productivity, but human review and judgment remain essential. Always validate suggestions against project requirements and test thoroughly before committing.
