# Agent Development Guidelines

## UI Component Library

This project uses **Ant Design (antd)** as its primary UI component 
and styling library.

### Rules for Agents

- **DO** use Ant Design components for all UI elements
  (Button, Typography, Form, Input, Select, Modal, etc.)
- **DO** use Ant Design's theme token system for colors and spacing:
```tsx
  import { theme } from 'antd';
  const { token } = theme.useToken();
  // Use token.colorText, token.colorBgContainer, etc.
```
- **DO NOT** use Tailwind CSS utility classes for new development
- **DO NOT** use inline styles with hardcoded color values
- **DO NOT** add new Tailwind classes to existing components

### Dark/Light Mode

Dark and light mode is controlled through Ant Design's 
`ConfigProvider` and theme tokens. Do not use manual 
`isDarkMode` checks with Tailwind classes. Use 
`token.colorText`, `token.colorBgContainer` etc. instead.

### Example — Correct Pattern
```tsx
import { Typography, theme } from 'antd';
const { token } = theme.useToken();
const { Text } = Typography;

// Correct
<Text>{label}</Text>

// Wrong
<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
  {label}
</span>
```