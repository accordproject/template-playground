const MODEL = `namespace test@1.0.0

concept LoyaltyStatus {
    o String level
}

@template
concept TemplateData {
    o LoyaltyStatus loyaltyStatus optional
}`;

const TEMPLATE = `{{#optional loyaltyStatus}}Your loyalty status: {{level}}{{else}}You do not have a loyalty status.{{/optional}}

Done.
`;

const DATA = {
    "$class" : "test@1.0.0.TemplateData"
};

const NAME = 'Optional';
export {NAME, MODEL,DATA,TEMPLATE};