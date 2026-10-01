import Link from "next/link";
import { revalidatePath } from "next/cache";
import { authed, doLogin, doLogout } from "../../lib/auth.js";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

async function login(fd) {
  "use server";
  await doLogin(fd.get("pw"));
  revalidatePath("/admin", "layout");
}
async function logout() {
  "use server";
  await doLogout();
  revalidatePath("/admin", "layout");
}

export default async function AdminLayout({ children }) {
  if (!(await authed())) {
    return (
      <form action={login} className="panel" style={{ maxWidth: 340, margin: "60px auto" }}>
        <h3 style={{ marginBottom: 8 }}>Admin login</h3>
        <label>Password</label><input type="password" name="pw" autoFocus />
        <p><button className="btn primary block">Sign in</button></p>
      </form>
    );
  }
  return (
    <div className="wrap" style={{ paddingTop: 18 }}>
      <nav className="adminnav no-print">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/enquiries">Enquiries</Link>
        <Link href="/admin/invoices">Invoices</Link>
        <form action={logout} style={{ marginLeft: "auto" }}><button className="btn ghost" style={{ padding: "7px 14px" }}>Log out</button></form>
      </nav>
      {children}
    </div>
  );
}
