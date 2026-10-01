import { notFound } from "next/navigation";
import { db, must, getTextSettings } from "../../../../../lib/db.js";
import { money, totals, COMPANY_KEYS } from "../../../../../lib/invoice.js";
import PrintButton from "../../../../../components/PrintButton.jsx";
export const dynamic = "force-dynamic";
export const metadata = { title: "Invoice" };

export default async function PrintInvoice({ params }) {
  const { id } = await params;
  const [inv, co] = await Promise.all([
    db().from("invoices").select("*, invoice_items(*)").eq("id", Number(id)).maybeSingle().then(must),
    getTextSettings(COMPANY_KEYS),
  ]);
  if (!inv) notFound();
  const items = inv.invoice_items.sort((a, b) => a.position - b.position);
  const t = totals(items, inv.vat_rate);
  return (
    <>
      <div className="no-print" style={{ textAlign: "center", margin: "0 0 16px" }}><PrintButton /></div>
      <div className="paper">
        <div className="head">
          <div>
            <h1>Tax Invoice</h1>
            <div className="mono" style={{ marginTop: 6 }}>{inv.number}</div>
            {inv.status === "paid" && <div className="st paid" style={{ marginTop: 8 }}>PAID</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <b style={{ fontSize: 17 }}>{co.company_name || "Your Company Name"}</b>
            <div style={{ whiteSpace: "pre-line" }}>{co.company_address}</div>
            {co.company_trn && <div>TRN: {co.company_trn}</div>}
            <div>{[co.company_phone, co.company_email].filter(Boolean).join(" · ")}</div>
          </div>
        </div>

        <div className="head">
          <div>
            <div className="muted">Bill to</div>
            <b>{inv.customer_company || inv.customer_name}</b>
            {inv.customer_company && inv.customer_name && <div>{inv.customer_name}</div>}
            <div style={{ whiteSpace: "pre-line" }}>{inv.customer_address}</div>
            {inv.customer_trn && <div>TRN: {inv.customer_trn}</div>}
            <div>{[inv.customer_phone, inv.customer_email].filter(Boolean).join(" · ")}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div><span className="muted">Issue date:</span> {inv.issue_date}</div>
            {inv.due_date && <div><span className="muted">Due date:</span> {inv.due_date}</div>}
          </div>
        </div>

        <table>
          <thead><tr><th>#</th><th>Description</th><th className="r">Qty</th><th className="r">Unit price</th><th className="r">Amount</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}><td>{i + 1}</td><td style={{ whiteSpace: "pre-line" }}>{it.description}</td><td className="r">{Number(it.qty)}</td>
                <td className="r">{money(it.unit_price)}</td><td className="r">{money(it.qty * it.unit_price)}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="totals" style={{ marginTop: 16 }}>
          <div><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
          <div><span>VAT ({Number(inv.vat_rate)}%)</span><span>{money(t.vat)}</span></div>
          <div className="tot"><span>Total AED</span><span>{money(t.total)}</span></div>
        </div>

        {inv.notes && <div className="foot"><b>Notes</b>{"\n"}{inv.notes}</div>}
        {co.bank_details && <div className="foot"><b>Bank details</b>{"\n"}{co.bank_details}</div>}
        {co.invoice_terms && <div className="foot">{co.invoice_terms}</div>}
      </div>
    </>
  );
}
