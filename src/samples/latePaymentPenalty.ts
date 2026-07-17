/**
 * latePaymentPenalty.ts — "Late Payment Penalty" sample with TypeScript logic
 *
 * Demonstrates time-based math, date handling, and calculations in contract logic.
 * Based on the late delivery and penalty template from Accord Project.
 */

export const NAME = 'Late Payment Penalty (with Logic)';

export const MODEL = `namespace org.acme.latepayment@1.0.0

import org.accordproject.time@0.3.0.Duration

@template
concept TemplateModel {
  o Boolean forceMajeure
  o Duration penaltyDuration
  o Double penaltyPercentage
  o Double capPercentage
  o Duration termination
  o String fractionalPart
}

transaction LatePaymentRequest {
  o Boolean forceMajeure
  o DateTime agreedPayment
  o Double invoiceValue
}

transaction LatePaymentResponse {
  o Double penalty
  o Boolean sellerMayTerminate
}

event LatePaymentEvent {
  o Boolean penaltyCalculated
  o Boolean contractTerminated
}

asset LatePaymentState identified by stateId {
  o String stateId
  o Integer count
  o Double totalPenalty
  o Boolean isTerminated
}
`;

export const TEMPLATE = `Late Payment and Penalty
----
In case of delayed payment{{#if forceMajeure}} except for Force Majeure cases,{{/if}} the Buyer shall pay to the Seller for every {{penaltyDuration}} of delay penalty amounting to {{penaltyPercentage}}% of the total value of the Invoice whose payment has been delayed.

1. Any fractional part of a {{fractionalPart}} is to be considered a full {{fractionalPart}}.
2. The total amount of penalty shall not however, exceed {{capPercentage}}% of the total value of the Invoice involved in late payment.
3. If the delay is more than {{termination}}, the Seller is entitled to terminate this Contract.`;

export const DATA = {
  $class: 'org.acme.latepayment@1.0.0.TemplateModel',
  forceMajeure: true,
  penaltyDuration: {
    $class: 'org.accordproject.time@0.3.0.Duration',
    amount: 2,
    unit: 'days'
  },
  penaltyPercentage: 10.5,
  capPercentage: 55,
  termination: {
    $class: 'org.accordproject.time@0.3.0.Duration',
    amount: 15,
    unit: 'days'
  },
  fractionalPart: 'days'
};

export const REQUEST = {
  $class: 'org.acme.latepayment@1.0.0.LatePaymentRequest',
  forceMajeure: false,
  agreedPayment: '2026-07-01T00:00:00.000Z',
  invoiceValue: 1000
};

export const LOGIC = `/*
 * Late Payment Penalty Logic
 * Demonstrates: Date/time handling, mathematical calculations, and cap enforcements
 */

class LatePaymentLogic extends TemplateLogic<any> {

  // Initialize the contract state
  async init(data: any) {
    return {
      state: {
        $class: 'org.acme.latepayment@1.0.0.LatePaymentState',
        stateId: 'late-payment-state',
        $identifier: 'late-payment-state',
        count: 0,
        totalPenalty: 0,
        isTerminated: false
      },
      events: []
    };
  }

  // Called for each request — calculates penalty based on days overdue
  async trigger(data: any, request: any, state: any) {
    const currentCount = (state?.count ?? 0) as number;
    const currentTotalPenalty = (state?.totalPenalty ?? 0) as number;
    const isAlreadyTerminated = (state?.isTerminated ?? false) as boolean;

    /*
     * Force Majeure: if the contract excludes penalties for force majeure
     * and the request claims force majeure, waive the penalty entirely
     */
    if (data.forceMajeure && request.forceMajeure) {
      return {
        result: {
          $class: 'org.acme.latepayment@1.0.0.LatePaymentResponse',
          $timestamp: new Date(),
          penalty: 0,
          sellerMayTerminate: false
        },
        events: [{
          $class: 'org.acme.latepayment@1.0.0.LatePaymentEvent',
          $timestamp: new Date(),
          penaltyCalculated: false,
          contractTerminated: false
        }],
        state: {
          $class: 'org.acme.latepayment@1.0.0.LatePaymentState',
          stateId: state.stateId,
          $identifier: state.stateId,
          count: currentCount + 1,
          totalPenalty: currentTotalPenalty,
          isTerminated: isAlreadyTerminated
        }
      };
    }

    // Demonstrate date/time handling
    const agreedPaymentDate = new Date(request.agreedPayment);
    // Use request timestamp for evaluation if available, else current date
    const evaluationDate = request.$timestamp ? new Date(request.$timestamp) : new Date();

    let daysOverdue = 0;
    if (evaluationDate > agreedPaymentDate) {
      const diffTime = Math.abs(evaluationDate.getTime() - agreedPaymentDate.getTime());
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate penalty periods (each period = penaltyDuration amount in days)
    const penaltyPeriods = Math.floor(daysOverdue / data.penaltyDuration.amount);
    let penalty = penaltyPeriods * (data.penaltyPercentage / 100) * request.invoiceValue;

    // The total amount of penalty shall not exceed capPercentage
    const maxPenalty = (data.capPercentage / 100) * request.invoiceValue;
    if (penalty > maxPenalty) {
      penalty = maxPenalty;
    }

    // Terminate condition
    const sellerMayTerminate = daysOverdue > data.termination.amount;

    return {
      result: {
        $class: 'org.acme.latepayment@1.0.0.LatePaymentResponse',
        $timestamp: new Date(),
        penalty: penalty,
        sellerMayTerminate: sellerMayTerminate
      },
      events: [{
        $class: 'org.acme.latepayment@1.0.0.LatePaymentEvent',
        $timestamp: new Date(),
        penaltyCalculated: true,
        contractTerminated: sellerMayTerminate
      }],
      state: {
        $class: 'org.acme.latepayment@1.0.0.LatePaymentState',
        stateId: state.stateId,
        $identifier: state.stateId,
        count: currentCount + 1,
        totalPenalty: currentTotalPenalty + penalty,
        isTerminated: isAlreadyTerminated || sellerMayTerminate
      }
    };
  }
}
`;
