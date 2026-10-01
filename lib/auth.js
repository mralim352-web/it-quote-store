import { cookies } from "next/headers";
import crypto from "node:crypto";

const token = () => crypto.createHash("sha256").update("admin:" + (process.env.ADMIN_PASSWORD || "")).digest("hex");
export const authed = async () => !!process.env.ADMIN_PASSWORD && (await cookies()).get("admin")?.value === token();

export async function doLogin(pw) {
  if (process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD) {
    (await cookies()).set("admin", token(), { httpOnly: true, sameSite: "lax", path: "/admin", maxAge: 60 * 60 * 24 * 7 });
  }
}
export async function doLogout() {
  (await cookies()).delete({ name: "admin", path: "/admin" });
}
