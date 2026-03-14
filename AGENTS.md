# Agent Development Guidelines

## UI Component Library

This project uses **Ant Design (antd)** as its primary UI component and styling library.

## Rules for Agents

### ✅ DO
- Use Ant Design components for all UI elements (`Button`, `Typography`, `Form`, `Input`, `Select`, `Modal`, etc.)
- Use Ant Design's theme token system for colors and spacing
- Use `theme.useToken()` for dark/light mode aware colors

### ❌ DO NOT
- Use Tailwind CSS utility classes for new development
- Use inline styles with hardcoded color values
- Add new Tailwind classes to existing components

## Dark/Light Mode

Dark and light mode is controlled through Ant Design's `ConfigProvider` and theme tokens. Do **not** use manual `isDarkMode` checks with Tailwind classes.
```tsx
// ✅ Correct
import { theme } from 'antd';
const { token } = theme.useToken();
// Use token.colorText, token.colorBgContainer, etc.

// ❌ Wrong
const label = isDarkMode ? 'text-gray-200' : 'text-gray-700';
```

## Component Example
```tsx
// ✅ Correct
import { Typography } from 'antd';
const { Text } = Typography;

<Text>{label}</Text>

// ❌ Wrong
<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
  {label}
</span>
```