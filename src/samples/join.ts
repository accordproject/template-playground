const MODEL = `namespace com.acme.insurance.auto@1.0.0
enum ItemType {
    o ACCESSORIES
    o SPARE_PARTS
    o CAR
}

@template
concept Insurance {
    o ItemType[] items
}`;

const TEMPLATE = `> Joins lists using formatting options

## en Locale

## Style

- Narrow: {{#join items locale="en" style="narrow"}}{{/join}}
- Long: {{#join items locale="en" style="long"}}{{/join}}
- Short: {{#join items locale="en" style="short"}}{{/join}}

## Disjunction

- Long: {{#join items locale="en" type="disjunction"}}{{/join}}

## Unit

- Long: {{#join items locale="en" type="unit"}}{{/join}}

## en-GB Locale

## Style

- Narrow: {{#join items locale="en-GB" style="narrow"}}{{/join}}
- Long: {{#join items locale="en-GB" style="long"}}{{/join}}
- Short: {{#join items locale="en-GB" style="short"}}{{/join}}

## Disjunction

- Long: {{#join items locale="en-GB" type="disjunction"}}{{/join}}

## Unit

- Long: {{#join items locale="en-GB" type="unit"}}{{/join}}

## fr Locale

## Style

- Narrow: {{#join items locale="fr" style="narrow"}}{{/join}}
- Long: {{#join items locale="fr" style="long"}}{{/join}}
- Short: {{#join items locale="fr" style="short"}}{{/join}}

## Disjunction

- Long: {{#join items locale="fr" type="disjunction"}}{{/join}}

## Unit

- Long: {{#join items locale="fr" type="unit"}}{{/join}}
`;

const DATA = {
  $class: "com.acme.insurance.auto@1.0.0.Insurance",
  items: ["CAR", "ACCESSORIES", "SPARE_PARTS"],
};

const NAME = "Join";
export { NAME, MODEL, DATA, TEMPLATE };
