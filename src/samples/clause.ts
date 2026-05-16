const MODEL = `namespace hello@1.0.0

concept Address {
    o String line1
    o String city
    o String state
    o String country
}


@template
concept Customer {
    o Address address
}`;

const TEMPLATE = `
> Renders an object using the \`#clause\` block.

{{#clause address}}  
#### Address
{{line1}},  
{{city}}, {{state}},  
{{country}}  
{{/clause}}
`;

const DATA = {
    "$class" : "hello@1.0.0.Customer",
    "address" : {
        "line1" : "1 Main Street",
        "city" : "Boson",
        "state" : "MA",
        "country" : "USA"
    }
};

const NAME = 'Clause';
const DESCRIPTION = "Renders a nested object with a clause block";
const DIFFICULTY = "Medium";
const TAGS = ["clause", "nested-data", "address"];

export { NAME, MODEL, DATA, TEMPLATE, DESCRIPTION, DIFFICULTY, TAGS };
