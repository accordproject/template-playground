import { getCurrencyFormatLogic } from "../utils/formatting";

const MODEL = `namespace payment@1.0.0

concept Party {
  o String name
  o String email
}

@template
concept PaymentReceipt {
  o Party payer
  o Party payee
  o Double amount
  o String currency
  o Double vatPercent
  o DateTime date
}
`;

const TEMPLATE = `

> A detailed payment receipt with VAT and parties

---

#### **Payer Details**
{{#clause payer}}  
- Name: **{{name}}**  
- Email: {{email}}  
{{/clause}}

---

#### **Payee Details**
{{#clause payee}}  
- Name: **{{name}}**  
- Email: {{email}}  
{{/clause}}

---

### 💳 Payment Summary

- Amount: ${getCurrencyFormatLogic('amount', 'currency')}  
- VAT ({{vatPercent}}%): ${getCurrencyFormatLogic('(amount * vatPercent / 100)', 'currency')}  
- Total Paid: **${getCurrencyFormatLogic('(amount + (amount * vatPercent / 100))', 'currency')}**  
- Payment Date: {{date as "D MMMM YYYY"}}  

---

Thank you for your payment.
`;

const DATA = {
  "$class": "payment@1.0.0.PaymentReceipt",
  "payer": {
    "name": "Alice Smith",
    "email": "alice@example.com"
  },
  "payee": {
    "name": "Bob's Services LLC",
    "email": "billing@bobsservices.com"
  },
  "amount": 250.00,
  "currency": "USD",
  "vatPercent": 10,
  "date": "2024-04-01T10:00:00Z"
};

const NAME = 'Payment Receipt';
export { NAME, MODEL, DATA, TEMPLATE };
