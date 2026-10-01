import { revalidatePath } from "next/cache";
import { db, must, getSettings, setSetting, getTextSettings, getCategoryMarkups } from "../../lib/db.js";
import { authed } from "../../lib/auth.js";
import { withPrices } from "../../lib/catalog.js";
import { fmtAED } from "../../lib/pricing.js";
import { COMPANY_KEYS } from "../../lib/invoice.js";
export const dynamic = "force-dynamic";

async function saveSettings(fd) {
  "use server";
  if (!(await authed())) return;
  const pct = Number(fd.get("default_markup_pct"));
  const step = Number(fd.get("round_to"));
  if (pct >= 0 && pct <= 100) await setSetting("default_markup_pct", pct);
  if (step >= 1 && step <= 100) await setSetting("round_to", step);
  const cat = String(fd.get("cat") || "").trim(), cpct = fd.get("cat_pct");
  if (cat) {
    if (cpct === "") must(await db().from("category_markup").delete().eq("category", cat));
    else must(await db().from("category_markup").upsert({ category: cat, pct: Number(cpct) }));
  }
  revalidatePath("/", "layout");
}
async function saveCompany(fd) {
  "use server";
  if (!(await authed())) return;
  for (const k of COMPANY_KEYS) await setSetting(k, String(fd.get(k) ?? "").slice(0, 1000));
  const vat = Number(fd.get("vat_rate"));
  if (vat >= 0 && vat <= 30) await setSetting("vat_rate", vat);
  revalidatePath("/admin", "layout");
}
async function productAction(fd) {
  "use server";
  if (!(await authed())) return;
  const id = Number(fd.get("id"));
  if (fd.get("op") === "hide") {
    const row = must(await db().from("products").select("hidden").eq("id", id).single());
    must(await db().from("products").update({ hidden: !row.hidden }).eq("id", id));
  }
  if (fd.get("op") === "override") {
    const v = fd.get("override");
    must(await db().from("products").update({ price_override: v === "" ? null : Number(v) }).eq("id", id));
  }
  revalidatePath("/", "layout");
}

const count = async (q) => (await q).count ?? 0;

export default async function Admin({ searchParams }) {
  const sp = await searchParams;
  const sb = db();
  const [s, co, cm, runs, total, instock, newEnq, openInv, cats] = await Promise.all([
    getSettings(), getTextSettings(COMPANY_KEYS), getCategoryMarkups(),
    sb.from("sync_runs").select("*").order("id", { ascending: false }).limit(1).then(must),
    count(sb.from("products").select("id", { count: "exact", head: true })),
    count(sb.from("products").select("id", { count: "exact", head: true }).eq("in_stock", true)),
    count(sb.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new").eq("channel", "form")),
    count(sb.from("invoices").select("id", { count: "exact", head: true }).in("status", ["draft", "sent"])),
    sb.from("products").select("category").not("category", "is", null).limit(3000).then(must),
  ]);
  let pq = sb.from("products").select("*").order("id", { ascending: false }).limit(30);
  const term = (sp.q || "").replace(/[,()%*\\]/g, "").trim();
  if (term) pq = pq.or(`name.ilike.%${term}%,mpn.ilike.%${term}%`);
  const prods = await withPrices(must(await pq), { keepCost: true });
  const run = runs[0];

  return (
    <>
      <div className="stats">
        <div><b>{total}</b><span>Products ({instock} in stock)</span></div>
        <div><b>{newEnq}</b><span>New enquiries</span></div>
        <div><b>{openInv}</b><span>Open invoices</span></div>
        <div><b style={{ fontSize: 14 }}>{run ? new Date(run.finished_at).toLocaleString("en-GB") : "never"}</b><span>Last sync {run ? `(${run.seen} seen, ${run.errors} errors)` : ""}</span></div>
      </div>

      <form action={saveSettings} className="panel">
        <b>Pricing</b>
        <div className="grid2">
          <div><label>Default markup %</label><input name="default_markup_pct" type="number" step="0.1" defaultValue={s.default_markup_pct} /></div>
          <div><label>Round up to nearest AED</label><input name="round_to" type="number" defaultValue={s.round_to} /></div>
          <div><label>Category override (exact name)</label><input name="cat" list="cats" /></div>
          <div><label>Markup % (blank = remove)</label><input name="cat_pct" type="number" step="0.1" /></div>
        </div>
        <datalist id="cats">{[...new Set(cats.map((c) => c.category))].map((c) => <option key={c} value={c} />)}</datalist>
        <p className="muted">Category overrides: {Object.entries(cm).map(([k, v]) => `${k}: ${v}%`).join(", ") || "none"}</p>
        <button className="btn primary">Save pricing</button>
      </form>

      <form action={saveCompany} className="panel">
        <b>Company &amp; invoice details</b> <span className="muted">(shown on every invoice)</span>
        <div className="grid2">
          <div><label>Company name</label><input name="company_name" defaultValue={co.company_name} /></div>
          <div><label>Tax Registration No. (TRN)</label><input name="company_trn" defaultValue={co.company_trn} /></div>
          <div><label>Phone</label><input name="company_phone" defaultValue={co.company_phone} /></div>
          <div><label>Email</label><input name="company_email" defaultValue={co.company_email} /></div>
          <div><label>VAT rate %</label><input name="vat_rate" type="number" step="0.1" defaultValue={s.vat_rate ?? 5} /></div>
        </div>
        <label>Address</label><textarea name="company_address" rows="2" defaultValue={co.company_address} />
        <label>Bank details (printed on invoice)</label><textarea name="bank_details" rows="3" defaultValue={co.bank_details} />
        <label>Terms &amp; notes (printed at the bottom)</label><textarea name="invoice_terms" rows="2" defaultValue={co.invoice_terms} />
        <p><button className="btn primary">Save company details</button></p>
      </form>

      <h2 style={{ fontSize: 20, margin: "26px 0 8px" }}>Products (latest 30)</h2>
      <form className="row" method="get"><input name="q" placeholder="Search name / part no" defaultValue={sp.q || ""} style={{ maxWidth: 320 }} /><button className="btn ghost">Search</button></form>
      <p />
      <table><thead><tr><th>Product</th><th>Supplier</th><th>Your price</th><th>Stock</th><th>Override</th><th></th></tr></thead><tbody>
        {prods.map((p) => (
          <tr key={p.id} style={{ opacity: p.hidden ? 0.5 : 1 }}>
            <td>{p.name.slice(0, 80)}</td><td>{fmtAED(p.supplier_price)}</td><td>{fmtAED(p.price)}</td><td>{p.in_stock ? "yes" : "no"}</td>
            <td><form action={productAction} className="row"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="op" value="override" />
              <input name="override" type="number" defaultValue={p.price_override ?? ""} placeholder="auto" style={{ width: 90 }} /><button className="btn ghost sm">Set</button></form></td>
            <td><form action={productAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="op" value="hide" /><button className="btn ghost sm">{p.hidden ? "Show" : "Hide"}</button></form></td>
          </tr>
        ))}
      </tbody></table>
    </>
  );
}
