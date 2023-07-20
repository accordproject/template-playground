const MODEL = `namespace test@1.0.0

concept LoyaltyStatus {
    o String level
}

@template
concept TemplateData {
    o LoyaltyStatus loyaltyStatus optional
}`;

const TEMPLATE = `> The \`{{#optional}}\` block is used with optional content.

{{#optional loyaltyStatus}}You have loyalty status.{{else}}You do not have a loyalty status.{{/optional}}

Done.
`;

const DATA = {
    "$class" : "test@1.0.0.TemplateData",
    "loyaltyStatus" : {
        $class: "test@1.0.0.LoyaltyStatus",
        level: "Gold"
    }
};

const NAME = 'Optional';
export {NAME, MODEL,DATA,TEMPLATE};