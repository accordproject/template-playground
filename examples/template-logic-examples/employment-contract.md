# Employment Contract with Template Logic

**Template Code**:
```template
EMPLOYMENT CONTRACT

Employee Name: {{employeeName}}
Position: {{position}}
Department: {{department}}
Start Date: {{startDate}}

COMPENSATION:
Base Salary: ${{baseSalary}}/year

{{#if position == "Senior"}}
BONUS STRUCTURE:
- Annual Bonus: 20% of base salary
- Target Bonus: ${{baseSalary * 0.2}}
- Stock Options: Yes
{{/if}}

{{#if position == "Mid"}}
BONUS STRUCTURE:
- Annual Bonus: 10% of base salary
- Target Bonus: ${{baseSalary * 0.1}}
- Stock Options: Limited
{{/if}}

{{#if position == "Junior"}}
BONUS STRUCTURE:
- Annual Bonus: 5% of base salary
- Target Bonus: ${{baseSalary * 0.05}}
- Stock Options: No
{{/if}}

BENEFITS:
{{#each benefits}}
- {{name}}: {{description}}
{{/each}}

This agreement becomes effective on {{startDate}}.
```

**Input Data**:
```json
{
  "employeeName": "John Doe",
  "position": "Senior",
  "department": "Engineering",
  "startDate": "2026-05-01",
  "baseSalary": 150000,
  "benefits": [
    { "name": "Health Insurance", "description": "Full coverage for employee and family" },
    { "name": "401k Match", "description": "100% match up to 6%" },
    { "name": "PTO", "description": "30 days annually" }
  ]
}
```

**Output**:
```
EMPLOYMENT CONTRACT

Employee Name: John Doe
Position: Senior
Department: Engineering
Start Date: 2026-05-01

COMPENSATION:
Base Salary: $150000/year

BONUS STRUCTURE:
- Annual Bonus: 20% of base salary
- Target Bonus: $30000
- Stock Options: Yes

BENEFITS:
- Health Insurance: Full coverage for employee and family
- 401k Match: 100% match up to 6%
- PTO: 30 days annually

This agreement becomes effective on 2026-05-01.
```

**Why This Needs Template Logic**:
- Position-based different terms
- Dynamic compensation structures
- Conditional benefits clauses
- Real-world complexity
