export const TENANT_COOKIE = "socios-tenant-id";

/** Read the selected fazenda ID on the client (browser only). */
export function getClientTenantId(): string | null {
  if (typeof document === "undefined") return null;
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${TENANT_COOKIE}=`))
      ?.split("=")[1] ?? null
  );
}

/** Write the tenant cookie client-side.
 *  domain=.sociosdoagro.com.br → shared across all subdomains (gef, plt, …).
 *  SameSite=Lax + Secure to comply with modern browser requirements on HTTPS. */
export function setTenantId(fazendaId: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? "";
  const domainAttr = domain ? `; domain=${domain}` : "";
  document.cookie = `${TENANT_COOKIE}=${fazendaId}; path=/${domainAttr}; max-age=${maxAge}; SameSite=Lax; Secure`;
}

export function clearTenantId() {
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? "";
  const domainAttr = domain ? `; domain=${domain}` : "";
  document.cookie = `${TENANT_COOKIE}=; path=/${domainAttr}; max-age=0; SameSite=Lax; Secure`;
}

/**
 * Build a sub-app URL with fazenda_id as a query param fallback.
 * Cookie is the primary mechanism; the param ensures the Vite SPAs pick it up on first load.
 */
export function buildAppUrl(baseUrl: string, fazendaId: string | null): string {
  if (!fazendaId) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set("fazenda_id", fazendaId);
  return url.toString();
}
