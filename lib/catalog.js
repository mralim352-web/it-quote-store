import { db, must, getSettings, getCategoryMarkups, DEMO } from "./db.js";
import { sellPrice } from "./pricing.js";
import { SAMPLE } from "./sample.js";

// Public product shape: supplier cost data (supplier_price, supplier_url) is stripped before it reaches pages.
export async function withPrices(rows, { keepCost = false } = {}) {
  const [s, c] = await Promise.all([getSettings(), getCategoryMarkups()]);
  return rows.map((p) => {
    const out = { ...p, supplier_price: p.supplier_price == null ? null : Number(p.supplier_price),
      price_override: p.price_override == null ? null : Number(p.price_override), price: null };
    out.price = sellPrice(out, s, c);
    if (!keepCost) { delete out.supplier_price; delete out.supplier_url; delete out.price_override; }
    return out;
  });
}

const PUBLIC_COLS = "id,slug,name,brand,mpn,category,image,in_stock,supplier_price,price_override";
const SORTS = {
  price_asc: [["supplier_price", true]],
  price_desc: [["supplier_price", false]],
  name: [["name", true]],
};

export async function listProducts({ q, category, sort, page = 1, perPage = 24 }) {
  if (DEMO) {
    const words = (q || "").toLowerCase().split(/\s+/).filter(Boolean);
    let rows = SAMPLE.filter((p) => (!category || p.category === category) &&
      words.every((w) => `${p.name} ${p.brand} ${p.mpn}`.toLowerCase().includes(w)));
    if (sort === "price_asc") rows.sort((a, b) => a.supplier_price - b.supplier_price);
    if (sort === "price_desc") rows.sort((a, b) => b.supplier_price - a.supplier_price);
    return { total: rows.length, rows: await withPrices(rows.slice((page - 1) * perPage, page * perPage)), pages: Math.max(1, Math.ceil(rows.length / perPage)) };
  }
  let query = db().from("products").select(PUBLIC_COLS, { count: "exact" }).eq("hidden", false);
  if (category) query = query.eq("category", category);
  for (const w of (q || "").split(/\s+/).filter(Boolean)) {
    const t = w.replace(/[,()%*\\]/g, "");
    if (t) query = query.or(`name.ilike.%${t}%,brand.ilike.%${t}%,mpn.ilike.%${t}%`);
  }
  // In-stock items always first, then the chosen sort.
  query = query.order("in_stock", { ascending: false });
  for (const [col, asc] of SORTS[sort] || SORTS.name) query = query.order(col, { ascending: asc, nullsFirst: false });
  const { data, count, error } = await query.range((page - 1) * perPage, page * perPage - 1);
  if (error) throw new Error(error.message);
  return { total: count ?? 0, rows: await withPrices(data), pages: Math.max(1, Math.ceil((count ?? 0) / perPage)) };
}

export async function getProduct(slug) {
  if (DEMO) {
    const p = SAMPLE.find((x) => x.slug === slug);
    return p ? (await withPrices([p]))[0] : null;
  }
  const row = must(await db().from("products").select(PUBLIC_COLS).eq("slug", slug).eq("hidden", false).maybeSingle());
  return row ? (await withPrices([row]))[0] : null;
}

let catCache = { at: 0, data: [] };
export async function getCategories() {
  if (DEMO) {
    const counts = {};
    for (const p of SAMPLE) counts[p.category] = (counts[p.category] || 0) + 1;
    return Object.entries(counts).map(([category, n]) => ({ category, n })).sort((a, b) => b.n - a.n);
  }
  if (Date.now() - catCache.at < 60_000) return catCache.data; // header calls this on every page
  // Small catalogue: aggregate in JS. Move to a SQL view if the catalogue grows past ~50k rows.
  const counts = {};
  for (let from = 0; ; from += 1000) {
    const rows = must(await db().from("products").select("category").eq("hidden", false).not("category", "is", null).range(from, from + 999));
    for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
    if (rows.length < 1000) break;
  }
  const data = Object.entries(counts).map(([category, n]) => ({ category, n })).sort((a, b) => b.n - a.n);
  catCache = { at: Date.now(), data };
  return data;
}
