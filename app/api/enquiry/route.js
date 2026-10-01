import { db, must } from "../../../lib/db.js";

async function notify(e) {
  // Optional instant email alert (set RESEND_API_KEY + NOTIFY_EMAIL). Never blocks the request.
  const key = process.env.RESEND_API_KEY, to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "onboarding@resend.dev", to,
        subject: `New enquiry: ${e.product_name} x${e.qty}`,
        text: `${e.name} | ${e.phone} | ${e.email}\n${e.product_name} x${e.qty}\n${e.message || ""}`,
      }),
    });
  } catch {}
}

export async function POST(req) {
  const b = await req.json().catch(() => null);
  if (!b) return Response.json({ error: "bad request" }, { status: 400 });
  const prodId = Number(b.productId);
  const prod = prodId ? must(await db().from("products").select("id,name").eq("id", prodId).maybeSingle()) : null;
  const clip = (v, n) => (v == null ? null : String(v).slice(0, n));
  const e = {
    product_id: prod?.id ?? null, product_name: prod?.name ?? null,
    qty: Math.min(Math.max(parseInt(b.qty) || 1, 1), 9999),
    name: clip(b.name, 120), phone: clip(b.phone, 40), email: clip(b.email, 160), message: clip(b.message, 1000),
    channel: b.channel === "whatsapp-click" ? "whatsapp-click" : "form",
  };
  try {
    must(await db().from("enquiries").insert(e));
  } catch {
    return Response.json({ error: "could not save" }, { status: 500 });
  }
  if (e.channel === "form") await notify(e);
  return Response.json({ ok: true });
}
