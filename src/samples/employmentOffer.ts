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
// --- BEGIN VC-SIGNED BLOCK (generated) ---
const HASH = '9a2da34bfca2bb6d9339e1af31c98f0d08a78dd4bcb29d365d06831e77acdfd5';
const VC = {
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://w3id.org/security/data-integrity/v2"
  ],
  "type": [
    "VerifiableCredential",
    "TemplateAuthorshipCredential"
  ],
  "issuer": "did:key:z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW",
  "validFrom": "2026-05-28T14:34:56.406Z",
  "credentialSubject": {
    "id": "ap-template:employment-offer-letter",
    "templateHash": "9a2da34bfca2bb6d9339e1af31c98f0d08a78dd4bcb29d365d06831e77acdfd5",
    "templateName": "Employment Offer Letter"
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2026-05-28T14:34:56.406Z",
    "verificationMethod": "did:key:z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW#z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3XkViBmdvdDjwvA7s5vKxp1RMXXxMkVqMuymhjzk2RDCUBT66LiBjPnDctaRXVgEczYnsmsptjDimXfetT2hdWrP"
  }
};

export { NAME, MODEL, DATA, TEMPLATE, HASH, VC };
// --- END VC-SIGNED BLOCK (generated) ---
