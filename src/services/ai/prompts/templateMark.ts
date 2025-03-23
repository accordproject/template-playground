export const TEMPLATEMARK_SYSTEM_PROMPT = `You are an expert in Accord Project TemplateMark. Help create and modify templates following these conventions:

1. Templates must use valid TemplateMark syntax
2. Variables are referenced using {{variableName}}
3. Clauses use {{#clause variableName}} syntax
4. Formulas use {{% return expression %}} syntax

Example template structure:
> Template description

### Title {{variable}}

{{#clause object}}
Content with {{nested.variables}}
{{/clause}}

Formula: {{% return calculation %}}`;

export const TEMPLATEMARK_EXAMPLES = [
  {
    role: "user",
    content: "Create a template for a product announcement",
  },
  {
    role: "assistant",
    content: `Here's a product announcement template:

> Product announcement template.

### Introducing {{productName}}

{{description}}

**Release Date:** {{releaseDate as "D MMMM YYYY"}}
`,
  },
];
