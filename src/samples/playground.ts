const MODEL = `namespace org.accordproject.service@1.0.0

concept ServiceItem {
    o String description
    o Double rate
    o Integer quantity
}

concept Compensation {
  o ServiceItem[] services
  o Integer paymentTerms
}

@template
concept ServiceAgreement {
    o String clientName
    o String clientAddress
    o String providerName
    o String providerAddress
    o DateTime effectiveDate
    o Compensation compensation
}`;

const TEMPLATE = `# SERVICE AGREEMENT

This Service Agreement is made and entered into as of 
{{effectiveDate as "D MMMM YYYY"}} 
by and between {{clientName}}, located at {{clientAddress}} (Client), 
and {{providerName}}, located at {{providerAddress}} (Provider).

---

## 1. Services

{{#clause compensation}}
### Services Provided

{{#ulist services}}
- {{description}} at {{rate as "0.00"}} per unit × {{quantity}}
{{/ulist}}

### Payment Terms
Payment is due within {{paymentTerms}} days of invoice.
{{/clause}}

---

## 2. Total Compensation

**Total Service Value:** {{%
return '$' + compensation.services
  .map(s => s.rate * s.quantity)
  .reduce((sum, cur) => sum + cur, 0)
  .toFixed(2);
%}}

---

## 3. Execution

IN WITNESS WHEREOF, the parties hereto have executed this Agreement.

### Client:
![Client Logo](https://ui-avatars.com/api/?name=AcmeCorp&size=40)

{{clientName}}

### Provider:

![provider logo](https://ui-avatars.com/api/?name=DevConsult+Ltd&size=40)

{{providerName}}

`;

const DATA = {
  "$class": "org.accordproject.service@1.0.0.ServiceAgreement",
  "effectiveDate": "2026-02-01T00:00:00Z",
  "clientName": "Acme Corp",
  "clientAddress": "123 Business Road, London, UK",
  "providerName": "DevConsult Ltd",
  "providerAddress": "456 Tech Street, Berlin, Germany",
  "compensation": {
    "$class": "org.accordproject.service@1.0.0.Compensation",
    "paymentTerms": 30,
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
  }
};

const NAME = 'Service Agreement';

export { NAME, MODEL, DATA, TEMPLATE };