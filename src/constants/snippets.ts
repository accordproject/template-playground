/**
 * Snippet Library Data
 * Defines reusable code snippets for TemplateMark, Concerto, and TypeScript
 */

export type SnippetCategory = 'templatemark' | 'concerto' | 'typescript';

export interface Snippet {
    id: string;
    title: string;
    description: string;
    code: string;
    category: SnippetCategory;
}

export interface SnippetGroup {
    name: string;
    key: SnippetCategory;
    icon: string;
    snippets: Snippet[];
}

// TemplateMark Snippets
const templateMarkSnippets: Snippet[] = [
    {
        id: 'tm-variable',
        title: 'Variable',
        description: 'Insert a simple variable',
        code: '{{variableName}}',
        category: 'templatemark',
    },
    {
        id: 'tm-conditional',
        title: 'Conditional Block',
        description: 'If-else conditional statement',
        code: `{{#if condition}}
  Content when true
{{else}}
  Content when false
{{/if}}`,
        category: 'templatemark',
    },
    {
        id: 'tm-loop',
        title: 'Loop (Each)',
        description: 'Iterate over an array',
        code: `{{#each items}}
  Item: {{this}}
{{/each}}`,
        category: 'templatemark',
    },
    {
        id: 'tm-formatted-number',
        title: 'Formatted Number',
        description: 'Display formatted currency or number',
        code: '{{amount as "K0,0.00"}}',
        category: 'templatemark',
    },
    {
        id: 'tm-formatted-date',
        title: 'Formatted Date',
        description: 'Display formatted date',
        code: '{{date as "MMMM DD, YYYY"}}',
        category: 'templatemark',
    },
    {
        id: 'tm-optional',
        title: 'Optional Block',
        description: 'Optional clause content',
        code: `{{#optional clause}}
  Optional content here
{{/optional}}`,
        category: 'templatemark',
    },
    {
        id: 'tm-with',
        title: 'With Block',
        description: 'Change context to nested object',
        code: `{{#with object}}
  {{property}}
{{/with}}`,
        category: 'templatemark',
    },
    {
        id: 'tm-join',
        title: 'Join Array',
        description: 'Join array elements with separator',
        code: '{{#join items separator=", "}}{{this}}{{/join}}',
        category: 'templatemark',
    },
    {
        id: 'tm-clause',
        title: 'Clause Block',
        description: 'Define a reusable clause',
        code: `{{#clause clauseName}}
  Clause content
{{/clause}}`,
        category: 'templatemark',
    },
];

// Concerto Snippets
const concertoSnippets: Snippet[] = [
    {
        id: 'co-namespace',
        title: 'Namespace',
        description: 'Define a namespace',
        code: 'namespace org.example@1.0.0',
        category: 'concerto',
    },
    {
        id: 'co-concept',
        title: 'Concept',
        description: 'Basic concept definition',
        code: `concept MyModel {
  o String field1
  o Integer field2
  o DateTime timestamp
}`,
        category: 'concerto',
    },
    {
        id: 'co-template-concept',
        title: 'Template Concept',
        description: 'Concept marked as template',
        code: `@template
concept TemplateModel {
  o String name
  o Double amount
}`,
        category: 'concerto',
    },
    {
        id: 'co-enum',
        title: 'Enum',
        description: 'Enumeration definition',
        code: `enum Status {
  o PENDING
  o APPROVED
  o REJECTED
}`,
        category: 'concerto',
    },
    {
        id: 'co-asset',
        title: 'Asset',
        description: 'Asset with identifier',
        code: `asset MyAsset identified by assetId {
  o String assetId
  o String description
  --> Participant owner
}`,
        category: 'concerto',
    },
    {
        id: 'co-participant',
        title: 'Participant',
        description: 'Participant definition',
        code: `participant Person identified by email {
  o String email
  o String firstName
  o String lastName
}`,
        category: 'concerto',
    },
    {
        id: 'co-transaction',
        title: 'Transaction',
        description: 'Transaction definition',
        code: `transaction MyTransaction {
  --> Asset asset
  o String newValue
}`,
        category: 'concerto',
    },
    {
        id: 'co-relationship',
        title: 'Relationship Field',
        description: 'Reference to another concept',
        code: '--> Participant participant',
        category: 'concerto',
    },
    {
        id: 'co-optional-field',
        title: 'Optional Field',
        description: 'Optional property',
        code: 'o String optionalField optional',
        category: 'concerto',
    },
    {
        id: 'co-array-field',
        title: 'Array Field',
        description: 'Array property',
        code: 'o String[] items',
        category: 'concerto',
    },
    {
        id: 'co-import',
        title: 'Import',
        description: 'Import from another namespace',
        code: 'import org.example.OtherConcept from org.example@1.0.0',
        category: 'concerto',
    },
];

// TypeScript Snippets (for future logic editing)
const typescriptSnippets: Snippet[] = [
    {
        id: 'ts-function',
        title: 'Function',
        description: 'Basic function definition',
        code: `function functionName(param: string): void {
  // Function body
}`,
        category: 'typescript',
    },
    {
        id: 'ts-arrow-function',
        title: 'Arrow Function',
        description: 'Arrow function expression',
        code: `const functionName = (param: string): void => {
  // Function body
};`,
        category: 'typescript',
    },
    {
        id: 'ts-interface',
        title: 'Interface',
        description: 'Interface definition',
        code: `interface InterfaceName {
  property: string;
  method(): void;
}`,
        category: 'typescript',
    },
    {
        id: 'ts-type',
        title: 'Type Alias',
        description: 'Type alias definition',
        code: 'type TypeName = string | number;',
        category: 'typescript',
    },
    {
        id: 'ts-class',
        title: 'Class',
        description: 'Class definition',
        code: `class ClassName {
  private property: string;

  constructor(property: string) {
    this.property = property;
  }

  public method(): void {
    // Method body
  }
}`,
        category: 'typescript',
    },
    {
        id: 'ts-async-function',
        title: 'Async Function',
        description: 'Async/await function',
        code: `async function asyncFunction(): Promise<void> {
  const result = await someAsyncOperation();
  return result;
}`,
        category: 'typescript',
    },
    {
        id: 'ts-try-catch',
        title: 'Try-Catch',
        description: 'Error handling block',
        code: `try {
  // Code that may throw
} catch (error) {
  console.error(error);
}`,
        category: 'typescript',
    },
];

// Grouped snippets by category
export const SNIPPET_GROUPS: SnippetGroup[] = [
    {
        name: 'TemplateMark',
        key: 'templatemark',
        icon: 'MdCode',
        snippets: templateMarkSnippets,
    },
    {
        name: 'Concerto',
        key: 'concerto',
        icon: 'MdDataObject',
        snippets: concertoSnippets,
    },
    {
        name: 'TypeScript',
        key: 'typescript',
        icon: 'MdJavascript',
        snippets: typescriptSnippets,
    },
];

// Helper function to get snippets by category
export const getSnippetsByCategory = (category: SnippetCategory): Snippet[] => {
    const group = SNIPPET_GROUPS.find((g) => g.key === category);
    return group ? group.snippets : [];
};

// Helper function to get all snippets
export const getAllSnippets = (): Snippet[] => {
    return SNIPPET_GROUPS.flatMap((group) => group.snippets);
};
