
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
// --- BEGIN VC-SIGNED BLOCK (generated) ---
const HASH = 'bc26e7a2a7a4a4641ffa1d8c9948807e544c7ffb5fce5775e822398fabd5cc2e';
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
  "validFrom": "2026-05-28T14:34:56.420Z",
  "credentialSubject": {
    "id": "ap-template:non-disclosure-agreement",
    "templateHash": "bc26e7a2a7a4a4641ffa1d8c9948807e544c7ffb5fce5775e822398fabd5cc2e",
    "templateName": "Non-Disclosure Agreement"
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2026-05-28T14:34:56.420Z",
    "verificationMethod": "did:key:z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW#z6MkhgEjPbjK8pCFRHQuvqy9MDg1vJzn47ZUyfpakZtZSVjW",
    "proofPurpose": "assertionMethod",
    "proofValue": "z46oXnu2PcDgNUTJ6iYEJGhbndiZcHAfBcUR6DH86kV1roWGaqFyC9STkuU5wEvEk1twWBwEEQ9mPgp679Bxpi61R"
  }
};

export { NAME, MODEL, DATA, TEMPLATE, HASH, VC };
// --- END VC-SIGNED BLOCK (generated) ---
