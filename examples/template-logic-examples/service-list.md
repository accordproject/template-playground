# Service List with Template Logic

**Template Code**:
```template
SERVICES PROVIDED

Total Services: {{services.length}}

{{#each services}}
- Service: {{name}}
  Cost: ${{price}}/month
  Duration: {{duration}} months
{{/each}}

---

Cost Breakdown:
{{#each services}}
{{name}}: ${{price * duration}}
{{/each}}

TOTAL COST: ${{calculateTotal}}
```

**Input Data**:
```json
{
  "services": [
    { "name": "Consulting", "price": 1000, "duration": 3 },
    { "name": "Development", "price": 2000, "duration": 6 },
    { "name": "Support", "price": 500, "duration": 12 }
  ]
}
```

**Output**:
```
SERVICES PROVIDED

Total Services: 3

- Service: Consulting
  Cost: $1000/month
  Duration: 3 months
- Service: Development
  Cost: $2000/month
  Duration: 6 months
- Service: Support
  Cost: $500/month
  Duration: 12 months

---

Cost Breakdown:
Consulting: $3000
Development: $12000
Support: $6000

TOTAL COST: $21000
```

**Why This Needs Template Logic**:
- Dynamic list rendering
- Loop through services
- Calculate per-service costs
- Impossible with static templates
