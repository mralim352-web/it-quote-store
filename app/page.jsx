import Link from "next/link";
import { listProducts, getCategories } from "../lib/catalog.js";
import { fmtAED } from "../lib/pricing.js";
import ProductCard from "../components/ProductCard.jsx";
import Icon, { catIcon } from "../components/Icon.jsx";
export const dynamic = "force-dynamic";

const WA = process.env.NEXT_PUBLIC_WHATSAPP;

export default async function Home() {
  const [cats, { rows, total }] = await Promise.all([getCategories(), listProducts({ perPage: 12 })]);
  const spotlight = rows.filter((p) => p.image).slice(0, 3);
  const inStock = rows.filter((p) => p.in_stock).length;
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div>
            <span className="eyebrow"><span className="dot" />Live stock · UAE</span>
            <h1>Enterprise IT hardware, <em>quoted in minutes.</em></h1>
            <p className="lead">Servers, networking, laptops, components and more — real-time stock and transparent AED pricing. Message us on WhatsApp and we confirm availability before you commit.</p>
            <div className="cta">
              <a className="btn wa lg" href={`https://wa.me/${WA}`}><Icon name="chat" size={20} />Get a quote on WhatsApp</a>
              <Link className="btn ghost lg" href="/products">Browse catalogue</Link>
            </div>
            <div className="hero-stats">
              <div><b>{total > 99 ? `${Math.floor(total / 10) * 10}+` : total}</b><span>Products listed</span></div>
              <div><b>{cats.length}</b><span>Categories</span></div>
              <div><b>&lt; 5 min</b><span>Typical reply time</span></div>
            </div>
          </div>
          <div className="hero-cards">
            {spotlight.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} className="hcard">
                <img src={p.image} alt="" />
                <div><div className="nm">{p.name}</div><div className="pr">{fmtAED(p.price)}</div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="trust">
          <div><span className="ic"><Icon name="bolt" /></span><p style={{ margin: 0 }}><b>Live stock</b><span>Synced automatically all day</span></p></div>
          <div><span className="ic"><Icon name="shield" /></span><p style={{ margin: 0 }}><b>Confirmed pricing</b><span>Final price & availability on enquiry</span></p></div>
          <div><span className="ic"><Icon name="receipt" /></span><p style={{ margin: 0 }}><b>VAT invoice</b><span>Proper tax invoice for every order</span></p></div>
          <div><span className="ic"><Icon name="truck" /></span><p style={{ margin: 0 }}><b>UAE delivery</b><span>Arranged to your door or site</span></p></div>
        </div>

        <section className="section" style={{ marginTop: 0 }}>
          <div className="sec-head"><div><h2>Shop by category</h2><p>Everything for the office, data room and workstation.</p></div></div>
          <div className="cat-grid">
            {cats.slice(0, 12).map((c, i) => (
              <Link key={c.category} href={`/products?category=${encodeURIComponent(c.category)}`} className="cat-tile">
                <span className={`cat-ic tint-${i % 6}`}><Icon name={catIcon(c.category)} /></span>
                <b>{c.category}</b><span>{c.n} {c.n === 1 ? "product" : "products"}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="sec-head">
            <div><h2>Available now</h2><p>{inStock ? "Ready to ship — tap any product for a quote." : "Tap any product for a quote."}</p></div>
            <Link className="link-arrow" href="/products">View all →</Link>
          </div>
          <div className="grid">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>

        <section className="section">
          <div className="sec-head"><div><h2>How it works</h2><p>No carts, no waiting — just a straight answer.</p></div></div>
          <div className="steps">
            <div className="step"><b>Find what you need</b><p>Search by product, brand or part number. Prices and stock reflect the market today.</p></div>
            <div className="step"><b>Message us your list</b><p>One tap on WhatsApp sends the product and quantity. We verify stock and give you the final price.</p></div>
            <div className="step"><b>We deliver &amp; invoice</b><p>Confirm the quote, we arrange delivery across the UAE and issue a VAT invoice.</p></div>
          </div>
        </section>

        <section className="section">
          <div className="cta-band">
            <div><h2>Can’t find it? We’ll source it.</h2><p>Send us a part number or a full bill of materials and we’ll come back with availability and pricing.</p></div>
            <a className="btn wa lg" href={`https://wa.me/${WA}`}><Icon name="chat" size={20} />Chat on WhatsApp</a>
          </div>
        </section>
      </div>
    </>
  );
}
