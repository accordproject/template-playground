const MODEL = `namespace hello@1.0.0

concept Address {
    o String line1
    o String city
    o String state
    o String country
}

@template
concept EventInvitation {
    o String eventName
    o DateTime eventDate
    o Address location
}`;

const TEMPLATE = `> An invitation to an event.

### You're Invited to {{eventName}}!

![Event Image](event_image.jpg)

**Date:** {{eventDate as "D MMMM YYYY"}}
**Location:**
{{#clause location}}
- {{line1}},  
  {{city}}, {{state}},  
  {{country}}  
{{/clause}}

We hope to see you there!
`;

const DATA = {
  $class: "hello@1.0.0.EventInvitation",
  eventName: "Grand Opening Gala",
  eventDate: "2024-06-15T18:00:00Z",
  location: {
    line1: "123 Main Street",
    city: "New York",
    state: "NY",
    country: "USA",
  },
};

const NAME = "Invitation";
export { NAME, MODEL, DATA, TEMPLATE };
