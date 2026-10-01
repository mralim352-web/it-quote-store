import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../../../lib/catalog.js";
import { fmtAED } from "../../../lib/pricing.js";
import EnquiryForm from "../../../components/EnquiryForm.jsx";
import Icon from "../../../components/Icon.jsx";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getProduct((await params).slug);
  return { title: p ? p.name.slice(0, 70) : "Product" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const specs = [["Brand", p.brand], ["Part number", p.mpn], ["Category", p.category], ["Availability", p.in_stock ? "In stock" : "On request"]].filter(([, v]) => v);
  return (
    <div className="wrap">
      <div className="crumbs">
        <Link href="/">Home</Link> / <Link href="/products">Catalogue</Link>
        {p.category && <> / <Link href={`/products?category=${encodeURIComponent(p.category)}`}>{p.category}</Link></>}
      </div>
      <div className="detail">
        <div className="gallery">{p.image ? <img src={p.image} alt={p.name} /> : <Icon name="box" size={80} />}</div>
        <div className="buybox">
          <div className="brandline">
            {p.brand && <span className="b">{p.brand}</span>}
            <span className={`pill ${p.in_stock ? "in" : "out"}`}><i />{p.in_stock ? "In stock" : "Available on request"}</span>
          </div>
          <h1>{p.name}</h1>
          {p.mpn && <div className="muted">Part no: <span className="mono">{p.mpn}</span></div>}
          <div className="pricebox">
            <div className="big">{p.price == null ? "Price on request" : <><small>AED</small>{fmtAED(p.price).replace("AED ", "")}</>}</div>
            <div className="vat">Excl. VAT · final price & availability confirmed on enquiry</div>
            <EnquiryForm productId={p.id} productName={p.name} price={fmtAED(p.price)}
              wa={process.env.NEXT_PUBLIC_WHATSAPP} phone={process.env.NEXT_PUBLIC_PHONE} email={process.env.NEXT_PUBLIC_EMAIL} />
          </div>
          <div className="perks">
            <div><span className="ic"><Icon name="check" /></span>Stock verified before you pay</div>
            <div><span className="ic"><Icon name="receipt" /></span>VAT tax invoice on every order</div>
            <div><span className="ic"><Icon name="truck" /></span>Delivery arranged across the UAE</div>
          </div>
          <div className="specs">{specs.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        </div>
      </div>
    </div>
  );
}
