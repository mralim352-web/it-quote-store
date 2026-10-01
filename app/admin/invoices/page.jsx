import Link from "next/link";
import { redirect } from "next/navigation";
import { db, must, getSettings } from "../../../lib/db.js";
import { authed } from "../../../lib/auth.js";
import { money, totals } from "../../../lib/invoice.js";
export const dynamic = "force-dynamic";
export const metadata = { title: "Invoices" };

async function newInvoice() {
  "use server";
  if (!(await authed())) return;
  const s = await getSettings();
  const inv = must(await db().from("invoices").insert({
    vat_rate: s.vat_rate ?? 5, due_date: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10),
  }).select("id").single());
  must(await db().from("invoice_items").insert({ invoice_id: inv.id, position: 0, description: "", qty: 1, unit_price: 0 }));
  redirect(`/admin/invoices/${inv.id}`);
}

export default async function Invoices({ searchParams }) {
  const sp = await searchParams;
  let q = db().from("invoices").select("*, invoice_items(qty, unit_price)").order("id", { ascending: false }).limit(100);
  if (sp.status) q = q.eq("status", sp.status);
  const rows = must(await q).map((i) => ({ ...i, ...totals(i.invoice_items, i.vat_rate) }));
  const sum = (st) => rows.filter((r) => r.status === st).reduce((a, r) => a + r.total, 0);
  const tabs = [[undefined, "All"], ["draft", "Draft"], ["sent", "Sent"], ["paid", "Paid"], ["cancelled", "Cancelled"]];
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 26 }}>Invoices</h1>
        <form action={newInvoice}><button className="btn primary">+ New invoice</button></form>
      </div>
      <div className="stats">
        <div><b>AED {money(sum("sent"))}</b><span>Awaiting payment</span></div>
        <div><b>AED {money(sum("paid"))}</b><span>Paid</span></div>
        <div><b>AED {money(sum("draft"))}</b><span>Drafts</span></div>
      </div>
      <div className="tabs">{tabs.map(([k, l]) => <Link key={l} href={k ? `/admin/invoices?status=${k}` : "/admin/invoices"} className={sp.status === k ? "on" : ""}>{l}</Link>)}</div>
      {!rows.length ? <div className="empty">No invoices yet. Convert an enquiry, or create one from scratch.</div> : (
        <table><thead><tr><th>No.</th><th>Customer</th><th>Date</th><th>Due</th><th>Total (AED)</th><th>Status</th><th /></tr></thead><tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><b>{r.number}</b></td><td>{r.customer_company || r.customer_name || <span className="muted">—</span>}</td>
              <td>{r.issue_date}</td><td>{r.due_date || "—"}</td><td>{money(r.total)}</td>
              <td><span className={`st ${r.status}`}>{r.status}</span></td>
              <td><Link className="btn ghost sm" href={`/admin/invoices/${r.id}`}>Open</Link></td>
            </tr>
          ))}
        </tbody></table>
      )}
    </>
  );
}
