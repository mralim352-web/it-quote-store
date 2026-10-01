// Selling price = supplier price x (1 + markup), rounded UP to the nearest `round_to` AED.
// Priority: per-product override > per-category markup > default markup.
export function sellPrice(p, settings, catMarkups) {
  if (p.price_override != null) return p.price_override;
  if (p.supplier_price == null) return null;
  const pct = catMarkups[p.category] ?? settings.default_markup_pct;
  const raw = p.supplier_price * (1 + pct / 100);
  const step = settings.round_to || 1;
  return Math.ceil(raw / step) * step;
}

export const fmtAED = (n) =>
  n == null ? "Price on request" : "AED " + Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 });
