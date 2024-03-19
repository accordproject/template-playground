const MODEL = `namespace hello@1.0.0

@template
concept ProductAnnouncement {
    o String productName
    o String description
    o DateTime releaseDate
}`;

const TEMPLATE = `> Product announcement template.

### Introducing {{productName}}

{{description}}

**Release Date:** {{releaseDate as "D MMMM YYYY"}}
`;

const DATA = {
  $class: "hello@1.0.0.ProductAnnouncement",
  productName: "New Product X",
  description:
    "Check out our latest product offering, featuring advanced features and improved performance.",
  releaseDate: "2024-10-01T00:00:00Z",
};

const NAME = "Announcement";
export { NAME, MODEL, DATA, TEMPLATE };
