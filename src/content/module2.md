# Module 2

## _Draft a TemplateMark template_

[TemplateMark](https://docs.accordproject.org/docs/markup-templatemark) extends Markdown with special syntax for binding template text to your Concerto data model. Variables and blocks in your template map directly to properties in your model.

---

### Basic Variables

Variables are written as `{{propertyName}}` and insert values from your data:

```
Hello {{name}}.
```

If `name` is `"World"`, this produces: **Hello World.**

The variable name must match a property in your Concerto model.

---

### Variable Types

How variables render depends on their type in the model:

| Model Type | Template Syntax | Example Output |
|------------|-----------------|----------------|
| `String` | `{{name}}` | `"Alice"` appears as Alice |
| `Integer` / `Long` | `{{count}}` | `42` appears as 42 |
| `Double` | `{{rate}}` | `3.14` appears as 3.14 |
| `Boolean` | Use `{{#if}}` blocks | See conditionals below |
| `DateTime` | `{{date}}` | Default: `04/12/2026` |
| `Enum` | `{{status}}` | `ACTIVE` appears as ACTIVE |

---

### Formatted DateTime

Format dates using the `as` keyword with format tokens:

```
The agreement starts on {{startDate as "DD MMMM YYYY"}}.
```

Produces: **The agreement starts on 12 April 2026.**

**Common date format tokens:**

| Token | Description | Example |
|-------|-------------|---------|
| `YYYY` | 4-digit year | 2026 |
| `MM` | 2-digit month | 04 |
| `MMM` | Short month | Apr |
| `MMMM` | Full month | April |
| `DD` | 2-digit day | 12 |
| `D` | Day (1-2 digits) | 5 |
| `HH:mm` | 24-hour time | 14:30 |

---

### Formatted Numbers

Format numeric values with thousands separators and decimal precision:

```
The total is {{amount as "0,0.00"}}.
```

Produces: **The total is 1,234.56.**

**Number format tokens:**

| Format | Example Output | Description |
|--------|----------------|-------------|
| `0,0` | 1,234 | Comma separators |
| `0,0.00` | 1,234.56 | Two decimal places |
| `0 0,00` | 1 234,56 | European format |

---

### Conditional Blocks

Use `{{#if}}` for Boolean conditions:

```
{{#if isVIP}}You qualify for VIP benefits.{{/if}}
```

With an else branch:

```
{{#if isActive}}Account is active.{{else}}Account is inactive.{{/if}}
```

---

### Optional Blocks

Use `{{#optional}}` for properties that may be absent:

```
{{#optional nickname}}Also known as {{nickname}}.{{/optional}}
```

With an else branch for missing values:

```
{{#optional nickname}}Also known as {{nickname}}.{{else}}No nickname provided.{{/optional}}
```

---

### Lists

#### Unordered Lists

Use `{{#ulist}}` for bullet points:

```
{{#ulist items}}
- {{name}}: {{description}}
{{/ulist}}
```

#### Ordered Lists

Use `{{#olist}}` for numbered lists:

```
{{#olist steps}}
1. {{instruction}}
{{/olist}}
```

#### Inline Join

Use `{{#join}}` for comma-separated inline lists:

```
Participants: {{#join attendees separator=", "}}{{name}}{{/join}}.
```

Produces: **Participants: Alice, Bob, Charlie.**

---

### With Blocks (Scope Change)

Use `{{#with}}` to access nested object properties:

```
{{#with address}}
Street: {{street}}
City: {{city}}, {{country}}
{{/with}}
```

This changes the scope so you can reference nested properties directly.

---

### Clause Blocks

Use `{{#clause}}` to embed reusable clauses within contracts:

```
## Payment Terms

{{#clause payment}}
The buyer shall pay {{amount}} within {{days}} days.
{{/clause}}
```

---

### Markdown Formatting

TemplateMark supports standard Markdown:

```
# Heading 1
## Heading 2

**Bold text** and *italic text*.

- Bullet point
- Another point

1. Numbered item
2. Second item
```

---

### Complete Example

Combining multiple features:

```
# Employment Agreement

This agreement is entered into on {{effectiveDate as "DD MMMM YYYY"}}.

**Employee**: {{employeeName}}
**Position**: {{position}}
**Salary**: {{salary as "0,0.00"}} per year

{{#if probation}}
This employment includes a {{probationPeriod}} probationary period.
{{/if}}

{{#optional benefits}}
## Benefits

{{#ulist benefits}}
- {{description}}
{{/ulist}}
{{/optional}}
```

Learn more in the [TemplateMark documentation](https://docs.accordproject.org/docs/markup-templatemark).
