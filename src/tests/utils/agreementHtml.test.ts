import { describe, it, expect } from 'vitest';
import { prepareAgreementHtml } from '../../utils/agreementHtml';

/*
 * Each block of the rendered agreement gets an explicit direction from its
 * own words, ignoring template variables, so right-to-left agreements read
 * correctly even when they mix in left-to-right values.
 */
const prepare = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = prepareAgreementHtml(html);
  return root;
};
const variable = (name: string, value: string) => `<span class="variable" name="${name}">${value}</span>`;

describe('prepareAgreementHtml', () => {
  it('reads an Arabic sentence that starts with an English value right to left', () => {
    const root = prepare(`<p>${variable('clientName', 'Northwind Logistics Ltd.')} هو العميل في هذا العقد.</p>`);
    expect(root.querySelector('p')).toHaveAttribute('dir', 'rtl');
  });

  it('isolates each variable so its own punctuation stays in place', () => {
    const root = prepare(`<p>العميل هو ${variable('clientName', 'Northwind Logistics Ltd.')}</p>`);
    expect(root.querySelector('span.variable')).toHaveAttribute('dir', 'auto');
  });

  it('takes the direction of a block from its variable when that is its only text', () => {
    const root = prepare(`<p>${variable('clientName', 'شركة النيل')}</p><p>${variable('other', 'Acme')}</p>`);
    const [arabic, english] = Array.from(root.querySelectorAll('p'));
    expect(arabic).toHaveAttribute('dir', 'rtl');
    expect(english).toHaveAttribute('dir', 'ltr');
  });

  it('keeps English blocks left to right', () => {
    const root = prepare('<h1>Consulting Agreement</h1><p>Made between <strong>Northwind</strong>.</p>');
    expect(root.querySelector('h1')).toHaveAttribute('dir', 'ltr');
    expect(root.querySelector('p')).toHaveAttribute('dir', 'ltr');
  });

  it('leaves blocks without letters to inherit their direction', () => {
    const root = prepare('<p>2026 - 100</p>');
    expect(root.querySelector('p')).not.toHaveAttribute('dir');
  });

  it('gives right-to-left lists and their items a right-to-left direction', () => {
    const root = prepare(
      '<ul><li>البند الأول</li><li>البند الثاني</li></ul>' +
      `<ol><li>${variable('amount', '100 USD')} تدفع شهريا</li></ol>`,
    );
    for (const el of root.querySelectorAll('ul, ol, li')) {
      expect(el).toHaveAttribute('dir', 'rtl');
    }
  });

  it('puts a right-to-left table and its first column on the right', () => {
    const root = prepare('<table><thead><tr><th>البند</th><th>Value</th></tr></thead><tbody><tr><td>المبلغ</td><td>100</td></tr></tbody></table>');
    const table = root.querySelector('table') as HTMLElement;
    expect(table).toHaveAttribute('dir', 'rtl');
    expect(table.style.marginLeft).toBe('auto');
    expect(root.querySelector('th')).toHaveAttribute('dir', 'rtl');
    // A cell with English text reads left to right inside the table.
    expect(root.querySelectorAll('th')[1]).toHaveAttribute('dir', 'ltr');
  });

  it('keeps an explicit direction from the template', () => {
    const root = prepare('<p dir="ltr">مثال</p><ul dir="ltr"><li>بند</li></ul>');
    expect(root.querySelector('p')).toHaveAttribute('dir', 'ltr');
    expect(root.querySelector('ul')).toHaveAttribute('dir', 'ltr');
  });

  it('still sanitises the agreement', () => {
    const root = prepare('<p>نص</p><img src="x" onerror="alert(1)"><script>alert(2)</script>');
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('img')).not.toHaveAttribute('onerror');
  });
});
