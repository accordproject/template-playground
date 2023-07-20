const MODEL = `namespace test@1.0.0

@template
concept Person {
    o String[] middleNames
}`;

const TEMPLATE = `## Middle Names
{{#olist middleNames}}
- {{this}}
{{/olist}}
`;

const DATA = {
    "$class" : "test@1.0.0.Person",
    "middleNames": ["Tenzin", "Isaac", "Mia"]
};

const NAME = 'List';
export {NAME, MODEL,DATA,TEMPLATE};