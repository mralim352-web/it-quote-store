import Link from "next/link";
import { fmtAED } from "../lib/pricing.js";
import Icon from "./Icon.jsx";

export default function ProductCard({ p }) {
  return (
    <Link href={`/product/${p.slug}`} className="card">
      <div className="ph">
        <span className="badge">
          <span className={`pill ${p.in_stock ? "in" : "out"}`}><i />{p.in_stock ? "In stock" : "On request"}</span>
        </span>
        {p.image && <img src={p.image} alt={p.name} loading="lazy" />}
      </div>
      <div className="body">
        {p.brand && <div className="brand">{p.brand}</div>}
        <h3>{p.name}</h3>
        <div className="foot">
          <div className="price">
            {p.price == null ? <small>Price on request</small> : <><small>AED</small>{fmtAED(p.price).replace("AED ", "")}</>}
          </div>
          <span className="go"><Icon name="arrow" /></span>
        </div>
      </div>
    </Link>
  );
}
