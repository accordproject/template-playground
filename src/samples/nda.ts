
const MODEL = `namespace org.accordproject.nda@0.0.2

@template
concept NDA {
  o String disclosingParty
  o String receivingParty
  o String purpose
  o DateTime effectiveDate
  o Integer durationInMonths
}

/**
 * The disclosing party records a disclosure made under the agreement
 */
transaction DisclosureRequest {
  o String description
  o DateTime disclosedAt
}

transaction DisclosureResponse {
  o Boolean covered
  o Integer disclosures
  o String message
}

event DisclosureRecorded {
  o String description
  o Boolean covered
}

/**
 * How many disclosures the agreement covers so far, and when it expires
 */
asset NDAState identified by stateId {
  o String stateId
  o Integer disclosures
  o DateTime expiresAt
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

const REQUEST = {
  $class: 'org.accordproject.nda@0.0.2.DisclosureRequest',
  description: 'Shared the product roadmap for the next two quarters',
  disclosedAt: '2025-06-15T10:00:00Z',
};

const LOGIC = `// Non-Disclosure Agreement Logic
// The term runs from the effective date; a disclosure is covered while the term lasts.
import type { INDA, IDisclosureRequest } from './org.accordproject.nda@0.0.2';

class NDALogic extends TemplateLogic<any> {

  // Called once: work out when the term ends
  async init(data: INDA) {
    const expiresAt = new Date(data.effectiveDate);
    expiresAt.setMonth(expiresAt.getMonth() + data.durationInMonths);
    return {
      state: {
        $class: 'org.accordproject.nda@0.0.2.NDAState',
        $identifier: 'nda-state',
        stateId: 'nda-state',
        disclosures: 0,
        expiresAt,
      },
      events: [],
    };
  }

  // Called per request: is this disclosure within the term?
  async trigger(data: INDA, request: IDisclosureRequest, state: any) {
    const disclosedAt = new Date(request.disclosedAt);
    const expiresAt = new Date(state.expiresAt);
    const covered = disclosedAt <= expiresAt;
    const disclosures = covered ? state.disclosures + 1 : state.disclosures;

    const message = covered
      ? 'Disclosure #' + disclosures + ' to ' + data.receivingParty + ' is covered until ' + expiresAt.toDateString()
      : 'Not covered: the agreement with ' + data.receivingParty + ' expired on ' + expiresAt.toDateString();

    return {
      result: {
        $class: 'org.accordproject.nda@0.0.2.DisclosureResponse',
        $timestamp: new Date(),
        covered,
        disclosures,
        message,
      },
      state: {
        ...state,
        disclosures,
      },
      events: [
        {
          $class: 'org.accordproject.nda@0.0.2.DisclosureRecorded',
          $timestamp: new Date(),
          description: request.description,
          covered,
        },
      ],
    };
  }
}

export default NDALogic;`;

export { NAME, MODEL, DATA, TEMPLATE, LOGIC, REQUEST };