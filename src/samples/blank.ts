const MODEL = `namespace hello@1.0.0

@template
concept NewTemplate {
    o String exampleField
}`;

const TEMPLATE = `> This is a blank template for users to create their own content.

### Welcome to your new template {{exampleField}}!

You can add your content here.
`;

const DATA = {
  $class: "hello@1.0.0.NewTemplate",
  exampleField: "Your value here",
};

const NAME = "New (Blank)";
export { NAME, MODEL, DATA, TEMPLATE };
