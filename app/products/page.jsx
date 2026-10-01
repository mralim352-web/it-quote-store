import Link from "next/link";
import { listProducts, getCategories } from "../../lib/catalog.js";
import ProductCard from "../../components/ProductCard.jsx";
export const dynamic = "force-dynamic";
export const metadata = { title: "Catalogue" };

export default async function Products({ searchParams }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ rows, total, pages }, cats] = await Promise.all([
    listProducts({ q: sp.q, category: sp.category, sort: sp.sort, page }), getCategories(),
  ]);
  const href = (o) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, category: sp.category, sort: sp.sort, ...o })) if (v) p.set(k, v);
    const s = p.toString();
    return "/products" + (s ? "?" + s : "");
  };
  const title = sp.category || (sp.q ? `Results for “${sp.q}”` : "All products");
  const sorts = [[undefined, "Name"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"]];
  return (
    <div className="wrap">
      <div className="crumbs"><Link href="/">Home</Link> / <Link href="/products">Catalogue</Link>{sp.category && <> / {sp.category}</>}</div>
      <div className="page-title">
        <h1>{title} <span className="count">({total})</span></h1>
        <div className="sort">Sort:{sorts.map(([v, l]) => <Link key={l} href={href({ sort: v, page: undefined })} className={(sp.sort || undefined) === v ? "on" : ""}>{l}</Link>)}</div>
      </div>
      <div className="layout">
        <aside className="side">
          <h4>Categories</h4>
          <Link href={href({ category: undefined, page: undefined })} className={!sp.category ? "on" : ""}>All products</Link>
          {cats.map((c) => (
            <Link key={c.category} href={href({ category: c.category, page: undefined })} className={sp.category === c.category ? "on" : ""}>
              {c.category}<span>{c.n}</span>
            </Link>
          ))}
        </aside>
        <div>
          {rows.length
            ? <div className="grid">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            : <div className="empty"><h3>No products found</h3><p className="muted">Can’t see what you need? We can source it for you.</p>
                <a className="btn wa" href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}>Ask on WhatsApp</a></div>}
          {pages > 1 && (
            <div className="pager">
              {page > 1 ? <Link className="btn ghost" href={href({ page: page - 1 })}>← Previous</Link> : <span />}
              <span>Page {page} of {pages}</span>
              {page < pages ? <Link className="btn ghost" href={href({ page: page + 1 })}>Next →</Link> : <span />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
