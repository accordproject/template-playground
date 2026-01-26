/**
 * Generates the template logic string for locale-aware currency formatting.
 * 
 * @param amountVar The variable name for the amount (e.g., 'amount', 'doubleValue')
 * @param currencyVar The variable name for the currency code (e.g., 'currency', 'currencyCode')
 * @returns The template logic string to be embedded in the template
 */
export const getCurrencyFormatLogic = (amountVar: string, currencyVar: string): string => {
  return `{{% return new Intl.NumberFormat(options.locale, { style: 'currency', currency: ${currencyVar}, currencyDisplay: 'code' } as any).format(${amountVar}) %}}`;
};
