# Module 3: Exploring Template Logic

In this module, we will dive into **Template Logic**, the component that makes Accord Project templates not just machine-readable but also machine-executable. Template Logic allows you to embed rules and functions within your templates, enabling dynamic calculations and automated processing of contract data.

## What is Template Logic?

While the Template Text and Template Model ensure that your templates are well-structured and machine-readable, Template Logic adds the capability to perform computations and enforce rules based on the data. This makes your templates not only executable but also interactive and adaptive to various scenarios.

![Template Logic](/public/assets/content/template_logic.png)

### Logic During Drafting

Template Logic can be embedded directly within the template text to perform real-time calculations or transformations based on the provided data. For example, consider a **Service Cost Estimate** template that calculates the total cost of services based on hourly rates and hours worked:

```js
## Service Cost Estimate

This document provides an estimate for the services requested by {{clientName}}.

### Service Details

- Service: {{serviceName}}
- Hours Worked: {{hoursWorked}}
- Hourly Rate: {{hourlyRate as "0,0.00"}}
- Estimated Total Cost: {{% calculateTotalCost(hoursWorked, hourlyRate) %}}

Thank you for considering our services.
```

In this example, `calculateTotalCost` is a function that computes the total cost based on the hours worked and the hourly rate:

```js
define function calculateTotalCost(hoursWorked: Integer, hourlyRate: Double) : Double {
  return hoursWorked * hourlyRate;
}
```

Here, `calculateTotalCost` takes `hoursWorked` and `hourlyRate` as inputs and returns the total cost. The function uses simple arithmetic operations to compute the result.

### Logic After Signature

Template Logic can also be applied to enforce rules or conditions after a contract has been signed. For instance, imagine a **Warranty Agreement** that needs to verify if a warranty claim is valid based on the date of purchase and the claim submission date:

```js
contract WarrantyAgreement over WarrantyAgreementModel {
  clause validateClaim(request : WarrantyClaimRequest) : ClaimValidationResponse {

    let claimDate = request.claimDate;
    let purchaseDate = contract.purchaseDate;
    let warrantyPeriod = Duration{ amount: 1, unit: ~org.accordproject.time.TemporalUnit.years };

    enforce isAfter(claimDate, purchaseDate) else
      throw ErgoErrorResponse{ message : "Claim date is before the purchase date." }
    ;

    let isValid =
      if isBefore(claimDate, addDuration(purchaseDate, warrantyPeriod))
      then VALID_CLAIM
      else EXPIRED_CLAIM
    ;
    return ClaimValidationResponse{
      status : isValid,
      client : contract.client,
      warrantyDetails : contract.warrantyDetails
    }
  }
}
```

This logic ensures that a warranty claim is only accepted if it falls within the warranty period. It checks if the claim date is after the purchase date and within the warranty duration, returning a validation response accordingly.

## Summary

In this module, we've explored Template Logic and how it enables your templates to perform computations and enforce rules dynamically. By embedding logic into your templates, you can create more interactive and responsive documents that adapt to different data inputs and scenarios.

## Share Your Work

Once you’ve finished editing or using a template, you can easily share your work with others. Simply click the **Share** button to generate a shareable link. This allows you to collaborate with others or distribute your completed templates efficiently.
