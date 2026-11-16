# Accord Project Template Development

This folder contains an Accord Project template.

## Template structure

- `package.json`: Template metadata and Accord Project configuration.
- `text/grammar.tem.md`: TemplateMark grammar and contract text.
- `model/`: Concerto model definitions (`.cto` files).
- `logic/`: Optional TypeScript template logic.
- `sample.json`: Sample data for the template, when present.
- `request.json`: Request data, when present.

## Development guidance

1. Inspect the existing template files before making changes.
2. Keep TemplateMark grammar consistent with the Concerto model.
3. Use the `concerto-author` skill when creating or editing `.cto` models.
4. Use the `template-author` skill when creating or editing templates.
5. Use the `concerto-validate` skill when validating JSON instances against Concerto models.
6. Preserve existing template metadata and namespace conventions.
7. Validate changes before considering the template complete.

## Accord Project skills

Install the official skills using:

```bash
npx skills add accordproject/skills
```

Select the relevant skills for template authoring, Concerto model authoring, and validation.

See the official skills repository:

https://github.com/accordproject/skills
