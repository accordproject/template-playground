/**
 * Employment Offer Letter sample
 * This sample demonstrates how multiple Accord Project components
 * work together in a real-world scenario.
 */

const MODEL = `namespace org.accordproject.employment@1.0.0

/**
 * Represents a monetary value with currency
 */
concept Salary {
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
  o Salary annualSalary
  o DateTime startDate
  o Probation probation optional
}

/**
 * The candidate answers the offer
 */
transaction AcceptanceRequest {
  o Boolean accepted
  o String note optional
}

transaction AcceptanceResponse {
  o String outcome
  o String message
}

event OfferAnswered {
  o String candidateName
  o String outcome
}

/**
 * Where the offer stands: pending, accepted or declined
 */
asset OfferState identified by stateId {
  o String stateId
  o String status
  o Integer answers
}`;
const TEMPLATE = `DATE: {{startDate as "DD MMMM YYYY"}}

Dear {{candidateName}},

We are pleased to offer you the position of **{{roleTitle}}** at **{{companyName}}**.

Your employment with {{companyName}} will commence on {{startDate as "DD MMMM YYYY"}}.

{{#clause annualSalary}}
Your annual gross salary will be **{{doubleValue as "0,0"}} {{currencyCode}}**, payable in accordance with company policies.
{{/clause}}

{{#clause probation}}
This offer includes a probation period of **{{months}} months**, during which your performance and suitability for the role will be evaluated.
{{/clause}}

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
    "$class": "org.accordproject.employment@1.0.0.Salary",
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

const REQUEST = {
  $class: 'org.accordproject.employment@1.0.0.AcceptanceRequest',
  accepted: true,
  note: 'Looking forward to joining the team.',
};

const LOGIC = `// Employment Offer Logic
// The offer starts pending; the candidate's first answer accepts or declines it, once.
import type { IEmploymentOffer, IAcceptanceRequest } from './org.accordproject.employment@1.0.0';

class EmploymentOfferLogic extends TemplateLogic<any> {

  // Called once: the offer is open and unanswered
  async init(data: IEmploymentOffer) {
    return {
      state: {
        $class: 'org.accordproject.employment@1.0.0.OfferState',
        $identifier: 'offer-state',
        stateId: 'offer-state',
        status: 'pending',
        answers: 0,
      },
      events: [],
    };
  }

  // Called per request: record the candidate's answer
  async trigger(data: IEmploymentOffer, request: IAcceptanceRequest, state: any) {
    if (state.status !== 'pending') {
      throw new Error('This offer was already ' + state.status + ' and cannot be answered again');
    }

    const outcome = request.accepted ? 'accepted' : 'declined';
    const message =
      data.candidateName + ' ' + outcome + ' the ' + data.roleTitle + ' offer from ' + data.companyName +
      (request.note ? ' - "' + request.note + '"' : '');

    return {
      result: {
        $class: 'org.accordproject.employment@1.0.0.AcceptanceResponse',
        $timestamp: new Date(),
        outcome,
        message,
      },
      state: {
        ...state,
        status: outcome,
        answers: state.answers + 1,
      },
      events: [
        {
          $class: 'org.accordproject.employment@1.0.0.OfferAnswered',
          $timestamp: new Date(),
          candidateName: data.candidateName,
          outcome,
        },
      ],
    };
  }
}

export default EmploymentOfferLogic;`;

export { NAME, MODEL, DATA, TEMPLATE, LOGIC, REQUEST };
