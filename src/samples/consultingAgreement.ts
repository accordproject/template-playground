/**
 * Consulting Agreement — the simplest kind of template: agreement text with
 * variables, each declared once in the model. No logic; nothing to simulate.
 * First card of the Start step gallery.
 */

const NAME = 'Consulting Agreement';

const MODEL = `namespace org.accordproject.consulting@1.0.0

/**
 * Every value the agreement text refers to, declared once.
 */
@template
concept ConsultingAgreement {
  o String clientName
  o String consultantName
  o String services
  o DateTime startDate
  o Integer termMonths
  o Double dailyRate
  o String currency
  o Integer paymentDays
  o Integer noticeDays
}`;

const TEMPLATE = `# Consulting Agreement

This Consulting Agreement is made on {{startDate as "D MMMM YYYY"}} between **{{clientName}}** (the "Client") and **{{consultantName}}** (the "Consultant").

## 1. Services

The Consultant will provide the following services to the Client: {{services}}.

## 2. Term

This Agreement starts on {{startDate as "D MMMM YYYY"}} and continues for {{termMonths}} months, unless ended earlier under clause 5.

## 3. Fees

The Client will pay the Consultant a daily rate of {{dailyRate as "0,0.00"}} {{currency}} for each day of services performed.

## 4. Payment

The Consultant will invoice the Client at the end of each month. Each invoice is payable within {{paymentDays}} days of receipt.

## 5. Termination

Either party may end this Agreement by giving the other {{noticeDays}} days' written notice.

Signed for the Client: **{{clientName}}**

Signed by the Consultant: **{{consultantName}}**
`;

const DATA = {
  $class: 'org.accordproject.consulting@1.0.0.ConsultingAgreement',
  clientName: 'Northwind Logistics Ltd',
  consultantName: 'Ana Ionescu',
  services: 'design and rollout of the warehouse inventory system',
  startDate: '2026-10-01T09:00:00.000Z',
  termMonths: 6,
  dailyRate: 650,
  currency: 'EUR',
  paymentDays: 30,
  noticeDays: 14,
};

export { NAME, MODEL, DATA, TEMPLATE };
