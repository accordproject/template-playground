# Template Logic Examples

These examples demonstrate why Template Logic is needed in Template Playground.

## The Problem

Currently, templates are static. If you need different content based on conditions 
or dynamic lists, you must use multiple templates or external logic.

## The Solution

Template Logic allows templates to be dynamic while staying readable and maintainable.

## Examples

1. **discount-agreement.md** - Conditional pricing based on quantity
2. **service-list.md** - Dynamic lists and calculations
3. **employment-contract.md** - Complex conditional clauses

## How to Use

1. Load template code in Template Playground
2. Input the JSON data
3. See the rendered output with logic applied

## Syntax

### Conditionals
```
{{#if condition}}
  Content if true
{{/if}}
```

### Loops
```
{{#each array}}
  {{this}} or {{property}}
{{/each}}
```

### Expressions
```
{{variable}}
{{calculation * expression}}
{{someFunction(arg)}}
```
