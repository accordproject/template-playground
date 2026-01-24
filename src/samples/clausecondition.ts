const MODEL = `namespace hello@1.0.0

concept Address {
    o String line1
    o String city
    o String state
    o String country
}


@template
concept Customer {
    o Address address optional
}`;

const TEMPLATE = `
> Renders an optional object using the \`#clause\` block with a conditional expression.

{{#clause address condition="return address!==undefined"}}  
#### Address
{{line1}},  
{{city}}, {{state}},  
{{country}}  
{{/clause}}

Done.
`;

const DATA = {
  $class: "hello@1.0.0.Customer",
};

const NAME = "Clause with Condition";
export { NAME, MODEL, DATA, TEMPLATE };
