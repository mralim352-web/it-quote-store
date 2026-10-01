import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, must, getSettings } from "../../../lib/db.js";
import { authed } from "../../../lib/auth.js";
import { withPrices } from "../../../lib/catalog.js";
export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };

async function setStatus(fd) {
  "use server";
  if (!(await authed())) return;
  const status = String(fd.get("status"));
  if (!["new", "contacted", "quoted"].includes(status)) return;
  must(await db().from("enquiries").update({ status, reject_reason: null }).eq("id", Number(fd.get("id"))));
  revalidatePath("/admin/enquiries");
}
async function rejectEnquiry(fd) {
  "use server";
  if (!(await authed())) return;
  must(await db().from("enquiries").update({ status: "rejected", reject_reason: String(fd.get("reason") || "").slice(0, 300) || null }).eq("id", Number(fd.get("id"))));
  revalidatePath("/admin/enquiries");
}
async function convertToInvoice(fd) {
  "use server";
  if (!(await authed())) return;
  const sb = db(), id = Number(fd.get("id"));
  const e = must(await sb.from("enquiries").select("*").eq("id", id).single());
  if (e.invoice_id) redirect(`/admin/invoices/${e.invoice_id}`);
  const s = await getSettings();
  const inv = must(await sb.from("invoices").insert({
    enquiry_id: id, customer_name: e.name, customer_phone: e.phone, customer_email: e.email,
    notes: e.message, vat_rate: s.vat_rate ?? 5,
    due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  }).select("id").single());

  let unit = 0, desc = e.product_name || "Item";
  if (e.product_id) {
    const p = must(await sb.from("products").select("*").eq("id", e.product_id).maybeSingle());
    if (p) { unit = (await withPrices([p], { keepCost: true }))[0].price ?? 0; desc = p.name + (p.mpn ? ` (P/N ${p.mpn})` : ""); }
  }
  must(await sb.from("invoice_items").insert({ invoice_id: inv.id, position: 0, description: desc, qty: e.qty || 1, unit_price: unit }));
  must(await sb.from("enquiries").update({ status: "invoiced", invoice_id: inv.id }).eq("id", id));
  redirect(`/admin/invoices/${inv.id}`);
}

const TABS = [["leads", "Leads"], ["new", "New"], ["contacted", "Contacted"], ["quoted", "Quoted"], ["invoiced", "Invoiced"], ["rejected", "Rejected"], ["clicks", "WhatsApp clicks"], ["all", "All"]];

export default async function Enquiries({ searchParams }) {
  const sp = await searchParams;
  const tab = sp.tab || "leads";
  let q = db().from("enquiries").select("*").order("id", { ascending: false }).limit(100);
  if (tab === "leads") q = q.eq("channel", "form").in("status", ["new", "contacted", "quoted"]);
  else if (tab === "clicks") q = q.eq("channel", "whatsapp-click");
  else if (tab !== "all") q = q.eq("status", tab);
  const rows = must(await q);

  return (
    <>
      <h1 style={{ fontSize: 26 }}>Customer enquiries</h1>
      <div className="tabs">{TABS.map(([k, l]) => <Link key={k} href={`/admin/enquiries?tab=${k}`} className={tab === k ? "on" : ""}>{l}</Link>)}</div>
      {tab === "clicks" && <p className="muted">People who tapped “WhatsApp enquiry” — no contact details captured; their message arrives in your WhatsApp.</p>}
      {!rows.length ? <div className="empty">Nothing here yet.</div> : (
        <table><thead><tr><th>When</th><th>Product</th><th>Qty</th><th>Customer</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {rows.map((e) => (
            <tr key={e.id}>
              <td>{new Date(e.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
              <td style={{ maxWidth: 280 }}>{e.product_name || "—"}</td>
              <td>{e.qty}</td>
              <td>{e.channel === "whatsapp-click" ? <span className="muted">WhatsApp click</span> : <>
                <b>{e.name}</b><div>{[e.phone, e.email].filter(Boolean).join(" · ")}</div>{e.message && <div className="muted">“{e.message}”</div>}</>}
              </td>
              <td><span className={`st ${e.status}`}>{e.status}</span>{e.reject_reason && <div className="muted">{e.reject_reason}</div>}</td>
              <td>
                {e.channel === "form" && (
                  <div className="qa">
                    {e.invoice_id ? <Link className="btn sm" href={`/admin/invoices/${e.invoice_id}`}>Open invoice</Link> : e.status !== "rejected" && (
                      <form action={convertToInvoice}><input type="hidden" name="id" value={e.id} /><button className="btn primary sm">Convert to invoice</button></form>
                    )}
                    {!e.invoice_id && e.status === "new" && <form action={setStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="contacted" /><button className="btn ghost sm">Mark contacted</button></form>}
                    {!e.invoice_id && e.status === "contacted" && <form action={setStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="quoted" /><button className="btn ghost sm">Mark quoted</button></form>}
                    {e.status === "rejected" && <form action={setStatus}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="status" value="new" /><button className="btn ghost sm">Reopen</button></form>}
                    {!e.invoice_id && e.status !== "rejected" && (
                      <form action={rejectEnquiry} className="qa"><input type="hidden" name="id" value={e.id} />
                        <input name="reason" placeholder="Reason (optional)" style={{ width: 130, padding: "6px 8px", fontSize: 12.5 }} />
                        <button className="btn danger sm">Reject</button></form>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody></table>
      )}
    </>
  );
}
