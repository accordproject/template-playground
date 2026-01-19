const MODEL = `namespace test@1.0.0

@template
concept Person {
    o String[] middleNames
}`;

const TEMPLATE = `> Ordered and unordered list expansion

## Lists

Ordered:
{{#olist middleNames}}
- {{this}}
{{/olist}}

Unordered:
{{#ulist middleNames}}
- {{this}}
{{/ulist}}

`;

const DATA = {
    "$class" : "test@1.0.0.Person",
    "middleNames": ["Tenzin", "Isaac", "Mia"]
};

const NAME = 'List';
export {NAME, MODEL,DATA,TEMPLATE};