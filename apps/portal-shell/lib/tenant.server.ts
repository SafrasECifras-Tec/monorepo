import { cookies } from "next/headers";
import { TENANT_COOKIE } from "./tenant";

/** Read the selected fazenda ID on the server (Server Components, Route Handlers, Middleware). */
export async function getServerTenantId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TENANT_COOKIE)?.value ?? null;
}
