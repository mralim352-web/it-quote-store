import "./globals.css";
import Link from "next/link";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import Icon from "../components/Icon.jsx";
import { getCategories } from "../lib/catalog.js";

const display = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const NAME = process.env.NEXT_PUBLIC_SITE_NAME || "TechPoint UAE";
const WA = process.env.NEXT_PUBLIC_WHATSAPP;
export const metadata = { title: { default: NAME, template: `%s · ${NAME}` }, description: "IT hardware, laptops, networking and servers in the UAE. Live stock, instant quotes on WhatsApp." };

export default async function RootLayout({ children }) {
  const cats = (await getCategories().catch(() => [])).slice(0, 12);
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <div className="topstrip">
          <div className="wrap">
            <span><span className="dot" /><b>Live stock</b> synced throughout the day</span>
            <span>Prices in AED · VAT invoice on every order</span>
            <span>Reply on WhatsApp within minutes</span>
          </div>
        </div>
        <header className="site-header">
          <div className="wrap bar">
            <Link href="/" className="logo">
              <span className="logo-mark"><svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg></span>
              {NAME}
            </Link>
            <form className="search" action="/products">
              <Icon name="search" />
              <input name="q" placeholder="Search RTX 5070, Dell PowerEdge, Cisco switch, part number…" aria-label="Search products" />
              <button className="btn primary">Search</button>
            </form>
            <a className="btn wa" href={`https://wa.me/${WA}`}><Icon name="chat" size={18} /><span>WhatsApp</span></a>
          </div>
          {cats.length > 0 && (
            <nav className="cats-nav"><div className="wrap">
              {cats.map((c) => <Link key={c.category} href={`/products?category=${encodeURIComponent(c.category)}`}>{c.category}</Link>)}
            </div></nav>
          )}
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <div className="fgrid">
              <div>
                <div className="logo"><span className="logo-mark"><svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg></span>{NAME}</div>
                <p>Business and consumer IT hardware, sourced and quoted fast. Message us what you need — we confirm stock and the final price before you commit.</p>
              </div>
              <div><h5>Shop</h5>{cats.slice(0, 5).map((c) => <Link key={c.category} href={`/products?category=${encodeURIComponent(c.category)}`}>{c.category}</Link>)}<Link href="/products">All products</Link></div>
              <div><h5>Company</h5><Link href="/">Home</Link><Link href="/products">Catalogue</Link><a href={`https://wa.me/${WA}`}>Request a bulk quote</a></div>
              <div><h5>Contact</h5><a href={`https://wa.me/${WA}`}>WhatsApp</a><a href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}>{process.env.NEXT_PUBLIC_PHONE}</a><a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>{process.env.NEXT_PUBLIC_EMAIL}</a></div>
            </div>
            <div className="fbottom"><span>© {new Date().getFullYear()} {NAME}. All rights reserved.</span><span>Prices exclude VAT unless stated. Stock and price confirmed on enquiry.</span></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
