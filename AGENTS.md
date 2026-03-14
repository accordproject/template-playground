# Agent Guidelines for Template Playground

This document provides guidelines for AI coding agents (e.g. GitHub Copilot) contributing to the Template Playground project.

## UI Component Library: Ant Design (antd)

**Always use Ant Design components** for any new UI development or when modifying existing components.

### Do NOT use Tailwind CSS for new components
This project previously used both Ant Design and Tailwind CSS. We are actively migrating away from Tailwind. When contributing:

- ❌ **Do NOT** add new Tailwind utility classes (e.g. `className="flex items-center gap-2"`)
- ❌ **Do NOT** create new inline `theme` objects or `useMemo` blocks that generate Tailwind class strings based on dark/light mode
- ✅ **DO** use Ant Design components: `Button`, `Input`, `Select`, `Form`, `Space`, `Flex`, `Typography`, `Divider`, `Checkbox`, `Switch`, `Collapse`, `Card`, etc.
- ✅ **DO** use Ant Design's `theme` token system via `useToken()` or `ConfigProvider` for custom styling if needed

### Dark Mode / Theming
Ant Design manages dark and light mode through `ConfigProvider` with `theme={{ algorithm: theme.darkAlgorithm }}`. The application's theme state is stored in Zustand (`backgroundColor`, `textColor`). Do **not** manually construct CSS class strings to handle dark/light variations — let Ant Design handle it automatically.

### Layout
Use Ant Design layout primitives instead of Tailwind flex/grid utilities:

| Instead of (Tailwind)                    | Use (Ant Design)                              |
|------------------------------------------|-----------------------------------------------|
| `<div className="flex items-center">`    | `<Flex align="center">`                       |
| `<div className="flex flex-col gap-4">`  | `<Space direction="vertical" size={16}>`      |
| `<div className="space-y-4">`            | `<Space direction="vertical" style={{width:'100%'}}>` |
| `<hr className="...">`                   | `<Divider />`                                 |
| `<h4 className="font-medium">`           | `<Typography.Text strong>`                    |
| `<p className="text-sm text-gray-500">`  | `<Typography.Text type="secondary">`          |

### Forms
Use `Form` and `Form.Item` for form layout and validation:

```tsx
import { Form, Input, Select, Button, Checkbox } from 'antd';

<Form layout="vertical">
  <Form.Item label="Provider">
    <Select options={[{ value: 'openai', label: 'OpenAI' }]} />
  </Form.Item>
  <Form.Item label="API Key">
    <Input.Password placeholder="Enter API key" />
  </Form.Item>
</Form>
```

### Buttons
Use `<Button>` from antd with the appropriate `type` prop:

```tsx
import { Button } from 'antd';

<Button type="primary" onClick={handleSave}>Save Configuration</Button>
<Button danger onClick={handleReset}>Reset Configuration</Button>
```

### Icons
Use icons from `@ant-design/icons`. Do not add new icon libraries unless absolutely necessary.

```tsx
import { SettingOutlined, RobotOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
```

### Existing Tailwind Usage
Some existing components still contain Tailwind classes from the legacy codebase. These are being phased out. When you touch an existing component, migrate any Tailwind classes you encounter to Ant Design equivalents.

The `.twp` wrapper class (scoped Tailwind preflight) should be removed as components are migrated to Ant Design.

## Commit Conventions
All commits must follow the Accord Project format and include DCO sign-off:

```
type(scope): description

Signed-off-by: Name <email>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Testing
- Unit tests live in `src/tests/` and use Vitest + Testing Library
- E2E tests live in `e2e/` and use Playwright
- New features must include tests
- When migrating components from Tailwind to Ant Design, update tests to use semantic selectors (`getByRole`, `getByLabel`, `getByPlaceholderText`) that remain stable across UI library changes
