// Automatic sync: supplier -> Supabase. Run once (`npm run sync`) or forever (`npm run sync:loop`).
// Options: --groups graphic_cards,laptops  --pages 2  --max 40  --delay 1500  --loop
import { db, must } from "../lib/db.js";
import { listProductUrls, fetchProduct } from "../sources/microless.mjs";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : def;
};
const GROUPS = (opt("groups", process.env.SYNC_GROUPS || "graphic_cards")).split(",");
const PAGES = Number(opt("pages", process.env.SYNC_PAGES || 2));
const MAX = Number(opt("max", process.env.SYNC_MAX || 0)); // 0 = no cap
const DELAY = Number(opt("delay", process.env.SYNC_DELAY_MS || 1500));
const INTERVAL_H = Number(opt("every", process.env.SYNC_EVERY_HOURS || 3));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
const now = () => new Date().toISOString();

async function runOnce() {
  const sb = db();
  const started = now();
  let seen = 0, changed = 0, errors = 0;

  for (const group of GROUPS) {
    let urls;
    try {
      urls = await listProductUrls(group, { maxPages: PAGES, delayMs: DELAY });
    } catch (e) {
      console.error(`[${group}] listing failed: ${e.message}`);
      errors++;
      continue;
    }
    if (MAX) urls = urls.slice(0, MAX);
    console.log(`[${group}] ${urls.length} products to check`);
    let groupErrors = 0;

    for (const url of urls) {
      try {
        const p = await fetchProduct(url, { delayMs: DELAY });
        const ts = now();
        if (p.gone) {
          must(await sb.from("products").update({ in_stock: false, updated_at: ts }).eq("supplier_url", url));
          continue;
        }
        seen++;
        const inStock = !!p.in_stock;
        const row = must(await sb.from("products").select("id,supplier_price,in_stock,updated_at")
          .eq("source", p.source).eq("source_sku", p.source_sku).maybeSingle());
        const fields = { name: p.name, brand: p.brand, mpn: p.mpn, category: p.category, image: p.image,
          supplier_price: p.supplier_price, in_stock: inStock, supplier_url: p.supplier_url, crawl_group: group, last_seen: ts };
        if (!row) {
          const ins = must(await sb.from("products").insert({
            ...fields, source: p.source, source_sku: p.source_sku, slug: `${slugify(p.name)}-${p.source_sku}`, updated_at: ts,
          }).select("id").single());
          must(await sb.from("price_history").insert({ product_id: ins.id, supplier_price: p.supplier_price, in_stock: inStock, at: ts }));
          changed++;
        } else {
          const diff = Number(row.supplier_price) !== p.supplier_price || row.in_stock !== inStock;
          must(await sb.from("products").update({ ...fields, ...(diff && { updated_at: ts }) }).eq("id", row.id));
          if (diff) {
            must(await sb.from("price_history").insert({ product_id: row.id, supplier_price: p.supplier_price, in_stock: inStock, at: ts }));
            changed++;
          }
        }
      } catch (e) {
        groupErrors++; errors++;
        console.error(`  ! ${e.message}`);
      }
    }

    // Anything in this group the supplier no longer lists -> out of stock (only after a full, clean crawl).
    if (!MAX && groupErrors === 0 && urls.length > 0) {
      const gone = must(await sb.from("products").update({ in_stock: false })
        .eq("crawl_group", group).eq("in_stock", true).lt("last_seen", started).select("id"));
      if (gone.length) console.log(`[${group}] ${gone.length} unlisted products marked out of stock`);
    }
  }

  must(await sb.from("sync_runs").insert({ started_at: started, finished_at: now(), seen, changed, errors, note: GROUPS.join(",") }));
  console.log(`sync done: seen=${seen} changed=${changed} errors=${errors}`);
}

if (args.includes("--loop")) {
  for (;;) {
    try { await runOnce(); } catch (e) { console.error("sync crashed:", e.message); }
    console.log(`next sync in ${INTERVAL_H}h`);
    await new Promise((r) => setTimeout(r, INTERVAL_H * 3600 * 1000));
  }
} else {
  await runOnce();
}
