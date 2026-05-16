const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const TEMPLATE = `> Includes a TypeScript formula that references the implicit \`now\` variable. 

Today is **{{% return now.toISOString() %}}**.
`;

const DATA = {
  $class: "hello@1.0.0.HelloWorld",
  name: "John Doe",
};

const NAME = "Formula Now";
const DESCRIPTION = "Uses the implicit now variable inside a formula";
const DIFFICULTY = "Medium";
const TAGS = ["formula", "date", "now"];

export { NAME, MODEL, DATA, TEMPLATE, DESCRIPTION, DIFFICULTY, TAGS };
