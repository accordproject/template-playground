const MODEL = `namespace org.accordproject.service@1.0.0

concept ServiceItem {
    o String description
    o Double rate
    o Integer quantity
}

@template
concept ServiceAgreement {
    o String clientName
    o String clientAddress
    o String providerName
    o String providerAddress
    o DateTime effectiveDate
    o ServiceItem[] services
    o Integer paymentTerms
}`;

const TEMPLATE = `# SERVICE AGREEMENT

This Service Agreement is made and entered into as of {{effectiveDate as "D MMMM YYYY"}} by and between {{clientName}}, located at {{clientAddress}} (Client), and {{providerName}}, located at {{providerAddress}} (SProvider).

## 1. Services

Provider shall perform the following services for Client:

{{#ulist services}}
- {{description}} at {{rate as "0.00"}} per unit × {{quantity}}
{{/ulist}}

## 2. Compensation

In consideration for the services provided, Client shall pay Provider the total amount calculated below:

**Total Service Value:** {{%
return '$' + services
  .map(s => s.rate * s.quantity)
  .reduce((sum, cur) => sum + cur, 0)
  .toFixed(2);
%}}

Payment is due within {{paymentTerms}} days of invoice.

## 3. Execution

IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first written above.

---

### Client:  
{{clientName}}

### Provider:  
{{providerName}}
`;

const DATA = {
  "$class": "org.accordproject.service@1.0.0.ServiceAgreement",
  "effectiveDate": "2026-02-01T00:00:00Z",
  "paymentTerms": 30,
  "clientName": "Acme Corp",
  "clientAddress": "123 Business Road, London, UK",
  "providerName": "DevConsult Ltd",
  "providerAddress": "456 Tech Street, Berlin, Germany",
  "services": [
    {
      "$class": "org.accordproject.service@1.0.0.ServiceItem",
      "description": "Backend Development",
      "rate": 80,
      "quantity": 40
    },
    {
      "$class": "org.accordproject.service@1.0.0.ServiceItem",
      "description": "Code Review",
      "rate": 60,
      "quantity": 10
    }
  ]
};

const NAME = 'Service Agreement';

export { NAME, MODEL, DATA, TEMPLATE };
