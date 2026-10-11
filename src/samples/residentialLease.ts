/**
 * Residential Lease — a template whose text depends on the data: an optional
 * parking clause, a pets sentence that flips on a boolean, a list of included
 * utilities, formatted money and a deposit computed from the rent. No logic.
 * Second card of the Start step gallery.
 */

const NAME = 'Residential Lease';

const MODEL = `namespace org.accordproject.lease@1.0.0

concept Address {
  o String street
  o String city
  o String postcode
}

/**
 * Only present when the lease includes a parking space
 */
concept Parking {
  o String spaceNumber
  o Double monthlyFee
}

@template
concept ResidentialLease {
  o String landlordName
  o String tenantName
  o Address property
  o DateTime startDate
  o Integer termMonths
  o Double monthlyRent
  o String currency
  o Integer depositMonths
  o String[] includedUtilities
  o Boolean petsAllowed
  o Parking parking optional
}`;

const TEMPLATE = `# Residential Lease Agreement

This Lease is made on {{startDate as "D MMMM YYYY"}} between **{{landlordName}}** (the "Landlord") and **{{tenantName}}** (the "Tenant").

## 1. Property

{{#clause property}}
The Landlord lets to the Tenant the property at {{street}}, {{city}} {{postcode}} (the "Property").
{{/clause}}

## 2. Term

The tenancy starts on {{startDate as "D MMMM YYYY"}} and runs for {{termMonths}} months.

## 3. Rent and deposit

All amounts in this Lease are in {{currency}}.

The Tenant will pay rent of **{{monthlyRent as "0,0.00"}}** per month, in advance, on the first day of each month.

Before moving in, the Tenant will pay a deposit equal to {{depositMonths}} months' rent, that is **{{% return (monthlyRent * depositMonths).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) %}}**. The deposit is returned at the end of the tenancy, less any amounts owed.

## 4. Utilities

The rent includes the following utilities:

{{#ulist includedUtilities}}
- {{this}}
{{/ulist}}

## 5. Pets

{{#if petsAllowed}}The Tenant may keep pets at the Property, provided they cause no damage or nuisance.{{else}}No pets may be kept at the Property without the Landlord's written consent.{{/if}}

{{#clause parking condition="return parking !== undefined"}}
## 6. Parking

The Tenant may use parking space {{spaceNumber}} for an additional {{monthlyFee as "0,0.00"}} per month, payable with the rent.
{{/clause}}

Signed by the Landlord: **{{landlordName}}**

Signed by the Tenant: **{{tenantName}}**
`;

const DATA = {
  $class: 'org.accordproject.lease@1.0.0.ResidentialLease',
  landlordName: 'Harbour View Properties Ltd',
  tenantName: 'Maria Popescu',
  property: {
    $class: 'org.accordproject.lease@1.0.0.Address',
    street: '14 Elm Street, Flat 3',
    city: 'Bristol',
    postcode: 'BS1 4DJ',
  },
  startDate: '2026-11-01T00:00:00.000Z',
  termMonths: 12,
  monthlyRent: 1250,
  currency: 'GBP',
  depositMonths: 2,
  includedUtilities: ['Water', 'Heating', 'Broadband'],
  petsAllowed: true,
  parking: {
    $class: 'org.accordproject.lease@1.0.0.Parking',
    spaceNumber: 'B7',
    monthlyFee: 60,
  },
};

export { NAME, MODEL, DATA, TEMPLATE };
