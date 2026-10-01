import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, must } from "../../../../lib/db.js";
import { authed } from "../../../../lib/auth.js";
import { money, totals } from "../../../../lib/invoice.js";
export const dynamic = "force-dynamic";

// One action for every button in the editor: the clicked button's value says what to do.
async function saveInvoice(fd) {
  "use server";
  if (!(await authed())) return;
  const sb = db(), id = Number(fd.get("id")), op = String(fd.get("op") || "save");
  const text = (k) => (String(fd.get(k) ?? "").trim() || null);

  const status = { sent: "sent", paid: "paid", cancelled: "cancelled", draft: "draft" }[op];
  must(await sb.from("invoices").update({
    customer_name: text("customer_name"), customer_company: text("customer_company"), customer_trn: text("customer_trn"),
    customer_phone: text("customer_phone"), customer_email: text("customer_email"), customer_address: text("customer_address"),
    issue_date: text("issue_date") || undefined, due_date: text("due_date"), notes: text("notes"),
    vat_rate: Math.min(Math.max(Number(fd.get("vat_rate")) || 0, 0), 30), ...(status && { status }),
  }).eq("id", id));

  // Replace line items with what the form submitted.
  const desc = fd.getAll("desc"), qty = fd.getAll("qty"), price = fd.getAll("price");
  const removeAt = op.startsWith("remove:") ? Number(op.slice(7)) : -1;
  const items = desc.map((d, i) => ({ invoice_id: id, description: String(d).slice(0, 500), qty: Math.max(Number(qty[i]) || 0, 0), unit_price: Math.max(Number(price[i]) || 0, 0) }))
    .filter((_, i) => i !== removeAt);
  if (op === "add") items.push({ invoice_id: id, description: "", qty: 1, unit_price: 0 });
  must(await sb.from("invoice_items").delete().eq("invoice_id", id));
  if (items.length) must(await sb.from("invoice_items").insert(items.map((it, i) => ({ ...it, position: i }))));

  // Keep the originating enquiry in step with the invoice.
  const inv = must(await sb.from("invoices").select("enquiry_id, status").eq("id", id).single());
  if (inv.enquiry_id && status === "paid") must(await sb.from("enquiries").update({ status: "won" }).eq("id", inv.enquiry_id));
  if (inv.enquiry_id && status === "cancelled") must(await sb.from("enquiries").update({ status: "rejected", reject_reason: "Invoice cancelled" }).eq("id", inv.enquiry_id));
  revalidatePath("/admin/invoices");
  if (op === "print") redirect(`/admin/invoices/${id}/print`);
}

async function deleteInvoice(fd) {
  "use server";
  if (!(await authed())) return;
  must(await db().from("invoices").delete().eq("id", Number(fd.get("id"))));
  redirect("/admin/invoices");
}

export default async function InvoiceEditor({ params }) {
  const { id } = await params;
  const inv = must(await db().from("invoices").select("*, invoice_items(*)").eq("id", Number(id)).maybeSingle());
  if (!inv) notFound();
  const items = inv.invoice_items.sort((a, b) => a.position - b.position);
  const t = totals(items, inv.vat_rate);
  const locked = inv.status === "paid" || inv.status === "cancelled";

  return (
    <form action={saveInvoice}>
      <input type="hidden" name="id" value={inv.id} />
      {/* Default button for Enter key, so Enter never triggers a line removal */}
      <button name="op" value="save" hidden aria-hidden="true" tabIndex={-1} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 26 }}>{inv.number} <span className={`st ${inv.status}`}>{inv.status}</span></h1>
        <div className="qa">
          <Link className="btn ghost sm" href="/admin/invoices">← All invoices</Link>
          <Link className="btn ghost sm" href={`/admin/invoices/${inv.id}/print`} target="_blank">Print / PDF</Link>
        </div>
      </div>

      <div className="panel">
        <b>Customer</b>
        <div className="grid2">
          <div><label>Contact name</label><input name="customer_name" defaultValue={inv.customer_name ?? ""} /></div>
          <div><label>Company</label><input name="customer_company" defaultValue={inv.customer_company ?? ""} /></div>
          <div><label>Phone</label><input name="customer_phone" defaultValue={inv.customer_phone ?? ""} /></div>
          <div><label>Email</label><input name="customer_email" defaultValue={inv.customer_email ?? ""} /></div>
          <div><label>Customer TRN (if VAT registered)</label><input name="customer_trn" defaultValue={inv.customer_trn ?? ""} /></div>
          <div><label>VAT rate %</label><input name="vat_rate" type="number" step="0.1" defaultValue={inv.vat_rate} /></div>
          <div><label>Issue date</label><input name="issue_date" type="date" defaultValue={inv.issue_date} /></div>
          <div><label>Due date</label><input name="due_date" type="date" defaultValue={inv.due_date ?? ""} /></div>
        </div>
        <label>Billing address</label><textarea name="customer_address" rows="2" defaultValue={inv.customer_address ?? ""} />
      </div>

      <table className="items"><thead><tr><th>Description</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 140 }}>Unit price (AED)</th><th style={{ width: 130 }}>Line total</th><th style={{ width: 40 }} /></tr></thead><tbody>
        {items.map((it, i) => (
          <tr key={it.id}>
            <td><textarea name="desc" rows="2" defaultValue={it.description} /></td>
            <td><input name="qty" type="number" step="any" min="0" defaultValue={Number(it.qty)} /></td>
            <td><input name="price" type="number" step="0.01" min="0" defaultValue={Number(it.unit_price)} /></td>
            <td>{money(it.qty * it.unit_price)}</td>
            <td><button name="op" value={`remove:${i}`} className="btn danger sm" title="Remove line">✕</button></td>
          </tr>
        ))}
      </tbody></table>
      <p><button name="op" value="add" className="btn ghost sm">+ Add line</button></p>

      <div className="totals panel">
        <div><span>Subtotal</span><b>{money(t.subtotal)}</b></div>
        <div><span>VAT ({Number(inv.vat_rate)}%)</span><b>{money(t.vat)}</b></div>
        <div className="tot"><span>Total AED</span><span>{money(t.total)}</span></div>
      </div>

      <div className="panel"><label>Notes (printed on invoice)</label><textarea name="notes" rows="2" defaultValue={inv.notes ?? ""} /></div>

      <div className="qa" style={{ margin: "6px 0 20px" }}>
        <button name="op" value="save" className="btn primary">Save</button>
        {inv.status === "draft" && <button name="op" value="sent" className="btn">Save &amp; mark sent</button>}
        {(inv.status === "draft" || inv.status === "sent") && <button name="op" value="paid" className="btn wa">Mark paid</button>}
        {!locked && <button name="op" value="cancelled" className="btn danger">Cancel invoice</button>}
        {locked && <button name="op" value="draft" className="btn ghost">Reopen as draft</button>}
        <button formAction={deleteInvoice} className="btn danger" style={{ marginLeft: "auto" }}>Delete</button>
      </div>
    </form>
  );
}
