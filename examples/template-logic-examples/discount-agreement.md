# Discount Agreement Example

## Using Template Logic for Conditional Content

**Template Code**:
```template
SERVICE AGREEMENT

Service Provider: {{providerName}}
Client: {{clientName}}
Service Amount: ${{baseAmount}}
Quantity: {{quantity}}

Subtotal: ${{baseAmount * quantity}}

{{#if quantity >= 100}}
BULK DISCOUNT APPLIED: 10%
Final Amount: ${{baseAmount * quantity * 0.9}}
{{/if}}

{{#if quantity < 100}}
No Discount Available
Final Amount: ${{baseAmount * quantity}}
{{/if}}

Terms: Payment due within 30 days.
```

**Input Data**:
```json
{
  "providerName": "Acme Corp",
  "clientName": "Client A",
  "baseAmount": 100,
  "quantity": 150
}
```

**Output**:
```
SERVICE AGREEMENT

Service Provider: Acme Corp
Client: Client A
Service Amount: $100
Quantity: 150

Subtotal: $15000

BULK DISCOUNT APPLIED: 10%
Final Amount: $13500

Terms: Payment due within 30 days.
```

**Why This Needs Template Logic**:
- Different clauses based on quantity
- Conditional pricing
- Dynamic final amounts
- Can't do this with static templates
