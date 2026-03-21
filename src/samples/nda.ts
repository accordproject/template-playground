
const MODEL = `namespace org.accordproject.nda@0.0.2

@template
concept NDA {
  o String disclosingParty
  o String receivingParty
  o String purpose
  o DateTime effectiveDate
  o Integer durationInMonths
}

`;
const TEMPLATE = `DATE: {{effectiveDate as "DD MMMM YYYY"}}

This Non-Disclosure Agreement ("Agreement") is entered into between  
**{{disclosingParty}}** and **{{receivingParty}}**.

## Purpose
The purpose of this Agreement is {{purpose}}.

## Term
This Agreement shall remain in effect for **{{durationInMonths}} months**
from the effective date.

This Agreement is effective as of the date written above.

Sincerely,  
**{{disclosingParty}}**
`;
const DATA = {
   "$class": "org.accordproject.nda@0.0.2.NDA",
  "disclosingParty": "Tech Innovators Inc.",
  "receivingParty": "John Doe",
  "purpose": "evaluating a potential business collaboration",
  "effectiveDate": "2025-02-01T00:00:00Z",
  "durationInMonths": 24
};
const NAME = 'Non-Disclosure Agreement';

export { NAME, MODEL, DATA, TEMPLATE };