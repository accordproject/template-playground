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

const TEMPLATE = `{{#clause address}}  
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
export {NAME, MODEL,DATA,TEMPLATE};