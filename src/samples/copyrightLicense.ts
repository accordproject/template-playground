export const NAME = 'Copyright License (with Logic)';

export const MODEL = `namespace org.accordproject.copyrightlicense@0.2.0

import org.accordproject.contract@0.2.0.{Clause,Contract} from https://models.accordproject.org/accordproject/contract@0.2.0.cto
import org.accordproject.runtime@0.2.0.{Request, Response, Obligation} from https://models.accordproject.org/accordproject/runtime@0.2.0.cto
import org.accordproject.money@0.3.0.MonetaryAmount from https://models.accordproject.org/money@0.3.0.cto

/* Requesting a payment */
transaction PaymentRequest extends Request {
}

/* PayOut response */
transaction PayOut extends Response {
  o MonetaryAmount amount
}

event PaymentObligationEvent extends Obligation {
  o MonetaryAmount amount
  o String description
}

asset PaymentClause extends Clause {
  o String amountText
  o MonetaryAmount amount
  o String paymentProcedure
}

/* The template model */
@template
asset TemplateModel extends Contract {
  /* the effective date */
  o DateTime effectiveDate

  /* licensee */
  o String licensee
  o String licenseeState
  o String licenseeEntityType
  o String licenseeAddress

  /* licensor */
  o String licensor
  o String licensorState
  o String licensorEntityType
  o String licensorAddress

  /* territory where license is granted */
  o String territory

  /* descriptions */
  o String purposeDescription
  o String workDescription

  /* payment */
  o PaymentClause paymentClause
}
`;

export const TEMPLATE = ` Copyright License Agreement

This COPYRIGHT LICENSE AGREEMENT (the "Agreement"), dated as of {{effectiveDate}} (the "Effective Date"), is made by and between {{licensee}} ("Licensee"), a {{licenseeState}} {{licenseeEntityType}} with offices located at {{licenseeAddress}}, and {{licensor}} ("Licensor"), a {{licensorState}} {{licensorEntityType}} with offices located at {{licensorAddress}}.

WHEREAS, Licensor solely and exclusively owns or controls the Work (as defined below) and wishes to grant to Licensee a license to the Work, and Licensee wishes to obtain a license to the Work for the uses and purposes described herein, each subject to the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants, terms, and conditions set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

License.

Grant of Rights. Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee and its affiliates during the Term (as defined below) an exclusive, transferable right and license in the {{territory}} (the "Territory"), to reproduce, publicly perform, display, transmit, and distribute the Work, including translate, alter, modify, and create derivative works of the Work, through all media now known or hereinafter developed for purposes of {{purposeDescription}}. The "Work" is defined as {{workDescription}}.

Permissions. Licensor has obtained from all persons and entities who are, or whose trademark or other property is, identified, depicted, or otherwise referred to in the Work, such written and signed licenses, permissions, waivers, and consents (collectively, "Permissions" and each, individually, a "Permission"), including those relating to publicity, privacy, and any intellectual property rights, as are or reasonably may be expected to be necessary for Licensee to exercise its rights in the Work as permitted under this Agreement, without incurring any payment or other obligation to, or otherwise violating any right of, any such person or entity.

Copyright Notices. Licensee shall ensure that its use of the Work is marked with the appropriate copyright notices specified by Licensor in a reasonably prominent position in the order and manner provided by Licensor. Licensee shall abide by the copyright laws and what are considered to be sound practices for copyright notice provisions in the Territory. Licensee shall not use any copyright notices that conflict with, confuse, or negate the notices Licensor provides and requires hereunder.

{{#clause paymentClause}}
Payment. As consideration in full for the rights granted herein, Licensee shall pay Licensor a one-time fee in the amount of {{amountText}} ({{amount}}) upon execution of this Agreement, payable as follows: {{paymentProcedure}}.
{{/clause}}

General.

Interpretation. For purposes of this Agreement, (a) the words "include," "includes," and "including" are deemed to be followed by the words "without limitation"; (b) the word "or" is not exclusive; and (c) the words "herein," "hereof," "hereby," "hereto," and "hereunder" refer to this Agreement as a whole. This Agreement is intended to be construed without regard to any presumption or rule requiring construction or interpretation against the party drafting an instrument or causing any instrument to be drafted.

Entire Agreement. This Agreement, including and together with any related attachments, constitutes the sole and entire agreement of the parties with respect to the subject matter contained herein, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, with respect to such subject matter. 

Severability. If any term or provision of this Agreement is invalid, illegal, or unenforceable in any jurisdiction, such invalidity, illegality, or unenforceability will not affect the enforceability of any other term or provision of this Agreement, or invalidate or render unenforceable such term or provision in any other jurisdiction. [Upon a determination that any term or provision is invalid, illegal, or unenforceable, [the parties shall negotiate in good faith to/the court may] modify this Agreement to effect the original intent of the parties as closely as possible in order that the transactions contemplated hereby be consummated as originally contemplated to the greatest extent possible.]

Assignment. Licensee may freely assign or otherwise transfer all or any of its rights, or delegate or otherwise transfer all or any of its obligations or performance, under this Agreement without Licensor's consent. This Agreement is binding upon and inures to the benefit of the parties hereto and their respective permitted successors and assigns.

`;

export const DATA = {
  "$class": "org.accordproject.copyrightlicense@0.2.0.TemplateModel",
  "effectiveDate": "2018-01-01T01:00:00.000+01:00",
  "licensee": "Me",
  "licenseeState": "NY",
  "licenseeEntityType": "Company",
  "licenseeAddress": "1 Broadway",
  "licensor": "Myself",
  "licensorState": "NY",
  "licensorEntityType": "Company",
  "licensorAddress": "2 Broadway",
  "territory": "United States",
  "purposeDescription": "stuff",
  "workDescription": "other stuff",
  "paymentClause": {
    "$class": "org.accordproject.copyrightlicense@0.2.0.PaymentClause",
    "amountText": "one hundred US Dollars",
    "amount": {
      "$class": "org.accordproject.money@0.3.0.MonetaryAmount",
      "doubleValue": 100,
      "currencyCode": "USD"
    },
    "paymentProcedure": "bank transfer",
    "clauseId": "26149239-4c42-4d57-b503-d5870d2337a8",
    "$identifier": "26149239-4c42-4d57-b503-d5870d2337a8"
  },
  "$identifier": "ed39610c-5572-4381-b2ac-f7d75044edbc",
  "contractId": "ed39610c-5572-4381-b2ac-f7d75044edbc"
};

export const REQUEST = {
  "$class": "org.accordproject.copyrightlicense@0.2.0.PaymentRequest",
  "$timestamp": "2018-01-01T00:00:00Z"
};

export const LOGIC = `import { ITemplateModel, IPaymentRequest, IPayOut, IPaymentObligationEvent } from "./org.accordproject.copyrightlicense@0.2.0";

type CopyrightLicenseResponse = {
    result: IPayOut;
    events: IPaymentObligationEvent[];
};

// @ts-ignore TemplateLogic is imported by the runtime
class CopyrightLicenseLogic extends TemplateLogic<ITemplateModel> {
    async trigger(data: ITemplateModel, request: IPaymentRequest): Promise<CopyrightLicenseResponse> {
        const event: IPaymentObligationEvent = {
            $class: 'org.accordproject.copyrightlicense@0.2.0.PaymentObligationEvent',
            $timestamp: new Date(),
            $identifier: data.$identifier,
            contract: data.contractId as unknown as IContract,
            amount: data.paymentClause.amount,
            description: data.licensee + " should pay contract amount to " + data.licensor
        };

        return {
            result: {
                $class: 'org.accordproject.copyrightlicense@0.2.0.PayOut',
                $timestamp: new Date(),
                amount: data.paymentClause.amount
            },
            events: [event]
        };
    }
}

export default CopyrightLicenseLogic;
`;
