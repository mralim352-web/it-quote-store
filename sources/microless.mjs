// Source adapter: reads PUBLIC pages of uae.microless.com (schema.org JSON-LD facts only).
// PROTOTYPE ONLY - swap this module for an official distributor feed/API; the rest of the system
// only depends on the normalized product shape returned by `fetchProduct`.
const BASE = "https://uae.microless.com";
const UA = "Mozilla/5.0 (compatible; ITQuoteStoreBot/0.1)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const decode = (s) =>
  (s ?? "")
    .replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ");

async function get(url, delayMs, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    await sleep(delayMs);
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) await sleep(5000 * (i + 1));
    } catch {
      await sleep(3000 * (i + 1));
    }
  }
  throw new Error("fetch failed: " + url);
}

export async function listProductUrls(categoryPath, { maxPages = 1, delayMs = 1500 } = {}) {
  const urls = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const html = await get(`${BASE}/${categoryPath}/l/?page=${page}`, delayMs);
    if (!html) break;
    const before = urls.size;
    for (const m of html.matchAll(/href="(https:\/\/uae\.microless\.com\/product\/[^"#]+)"/g)) urls.add(m[1]);
    if (urls.size === before) break; // no new products -> past the last page
  }
  return [...urls];
}

export async function fetchProduct(url, { delayMs = 1500 } = {}) {
  const html = await get(url, delayMs);
  if (!html) return { gone: true, url };
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let j;
    try { j = JSON.parse(m[1]); } catch { continue; }
    if (j["@type"] !== "Product") continue;
    const offer = [].concat(j.offers ?? [])[0] ?? {};
    const price = Number(offer.price);
    const crumbs = decode(j.category).split(">").map((s) => s.trim()).filter(Boolean);
    return {
      source: "microless",
      source_sku: String(j.sku),
      name: decode(j.name).replace(/\s*\|\s*$/, "").trim(),
      brand: decode(j.brand?.name) || null,
      mpn: decode(j.mpn) || null,
      category: crumbs[crumbs.length - 1] || null,
      image: j.image || null,
      supplier_price: Number.isFinite(price) && price > 0 ? price : null,
      in_stock: /InStock/i.test(offer.availability ?? "") ? 1 : 0,
      supplier_url: url,
    };
  }
  throw new Error("no Product JSON-LD: " + url);
}
