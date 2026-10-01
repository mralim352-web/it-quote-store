export const money = (n) => Number(n || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function totals(items, vatRate) {
  const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unit_price), 0);
  const vat = Math.round(subtotal * Number(vatRate) ) / 100;
  return { subtotal, vat, total: subtotal + vat };
}

export const COMPANY_KEYS = ["company_name", "company_trn", "company_address", "company_phone", "company_email", "bank_details", "invoice_terms"];
