"use client";
import { useState, useEffect } from "react";
import Icon from "./Icon.jsx";

export default function EnquiryForm({ productId, productName, price, wa, phone, email }) {
  const [qty, setQty] = useState(1);
  const [state, setState] = useState("idle");
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);
  const msg = `Hello, I am interested in: ${productName}\nQty: ${qty}\nListed price: ${price}\nPlease confirm availability and final price.\n${url}`;
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;

  async function submit(e) {
    e.preventDefault();
    setState("sending");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/enquiry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, qty, productId, channel: "form" }),
    }).catch(() => null);
    setState(res?.ok ? "done" : "error");
  }
  function logWa() {
    fetch("/api/enquiry", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty, productId, channel: "whatsapp-click" }),
    }).catch(() => {});
  }

  return (
    <div>
      <div className="actions">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="muted" style={{ fontWeight: 600 }}>Quantity</span>
          <div className="qty">
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">−</button>
            <input type="number" min="1" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} aria-label="Quantity" />
            <button type="button" onClick={() => setQty(qty + 1)} aria-label="Increase">+</button>
          </div>
        </div>
        <a className="btn wa lg block" href={waLink} target="_blank" rel="noreferrer" onClick={logWa}><Icon name="chat" size={20} />Get quote on WhatsApp</a>
        <div className="two">
          <a className="btn ghost" href={`tel:${phone}`}><Icon name="phone" size={17} />Call</a>
          <a className="btn ghost" href={`mailto:${email}?subject=${encodeURIComponent("Enquiry: " + productName)}&body=${encodeURIComponent(msg)}`}><Icon name="mail" size={17} />Email</a>
        </div>
      </div>
      <div className="quote">
        {state === "done" ? (
          <div className="success">Thank you! We received your request and will contact you shortly.</div>
        ) : !open ? (
          <button type="button" className="btn ghost block" onClick={() => setOpen(true)}>Prefer a written quotation? Request one</button>
        ) : (
          <form onSubmit={submit}>
            <h4>Request a quotation</h4>
            <label>Name</label><input name="name" required autoComplete="name" />
            <label>Phone / WhatsApp</label><input name="phone" required autoComplete="tel" />
            <label>Email (optional)</label><input name="email" type="email" autoComplete="email" />
            <label>Notes</label><textarea name="message" rows="2" />
            <p><button className="btn primary block" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send request"}</button></p>
            {state === "error" && <p className="out">Something went wrong — please use WhatsApp instead.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
