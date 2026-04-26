# Template Logic Support for Playground

## Overview

This module implements template logic execution in the browser, allowing templates 
to support conditional sections, loops, and expressions.

## Architecture

See `TECHNICAL_APPROACH.md` for detailed architecture and design decisions.

## Components

- **Parser** (`parser.ts`) - Parses handlebars-style syntax
- **Evaluator** (`evaluator.ts`) - Evaluates parsed templates with data
- **Types** (`types.ts`) - TypeScript interfaces

## Usage Example

```typescript
import { TemplateLogicParser } from './parser';
import { TemplateLogicEvaluator } from './evaluator';

const parser = new TemplateLogicParser();
const evaluator = new TemplateLogicEvaluator();

const template = `
  Amount: {{amount}}
  {{#if amount > 1000}}
    Discount Applied: {{amount * 0.1}}
  {{/if}}
`;

const data = { amount: 1500 };

const nodes = parser.parse(template);
const result = evaluator.evaluate(nodes, data);

console.log(result);
// Output:
// Amount: 1500
// Discount Applied: 150
```

## Testing

```bash
npm test -- src/template-logic/__tests__/
```

## Examples

See `examples/template-logic-examples/` for real-world examples:
- Conditional pricing
- Dynamic lists
- Complex contracts

## Next Steps

- Integration with Concerto v4
- Browser bundling with Vite
- UI integration
- Error handling improvements
- Performance optimization
