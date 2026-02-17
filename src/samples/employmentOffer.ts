/**
 * Employment Offer Letter sample
 * This sample demonstrates how multiple Accord Project components
 * work together in a real-world scenario.
 */

const MODEL = `namespace org.accordproject.employment@1.0.0

/**
 * Represents a monetary value with currency
 */
concept MonetaryAmount {
  o Double doubleValue
  o String currencyCode
}

/**
 * Optional probation details
 */
concept Probation {
  o Integer months
}

/**
 * Main template model for the employment offer
 */
@template
concept EmploymentOffer {
  o String candidateName
  o String companyName
  o String roleTitle
  o MonetaryAmount annualSalary
  o DateTime startDate
  o Probation probation optional
}`;
const TEMPLATE = `DATE: {{startDate as "DD MMMM YYYY"}}

Dear {{candidateName}},

We are pleased to offer you the position of **{{roleTitle}}** at **{{companyName}}**.

Your employment with {{companyName}} will commence on {{startDate as "DD MMMM YYYY"}}.

{{#clause annualSalary}}
Your annual gross salary will be **{{doubleValue as "0,0"}} {{currencyCode}}**, payable in accordance with company policies.
{{/clause}}

{{#if probation}}
{{#clause probation}}
This offer includes a probation period of **{{months}} months**, during which your performance and suitability for the role will be evaluated.
{{/clause}}
{{/if}}

We are excited about the opportunity to work with you and look forward to your contribution to the team.

Sincerely,  
**Human Resources**  
{{companyName}}`;
const DATA = {
  "$class": "org.accordproject.employment@1.0.0.EmploymentOffer",
  "candidateName": "Ishan Gupta",
  "companyName": "Tech Innovators Inc.",
  "roleTitle": "Junior AI Engineer",
  "annualSalary": {
    "$class": "org.accordproject.employment@1.0.0.MonetaryAmount",
    "doubleValue": 85000,
    "currencyCode": "USD"
  },
  "startDate": "2025-02-01T09:00:00.000Z",
  "probation": {
    "$class": "org.accordproject.employment@1.0.0.Probation",
    "months": 3
  }
};
const NAME = 'Employment Offer Letter';

export { NAME, MODEL, DATA, TEMPLATE };
