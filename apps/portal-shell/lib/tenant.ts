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

/** Write the tenant cookie client-side. SameSite=Lax so sub-apps receive it on first navigation. */
export function setTenantId(fazendaId: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${TENANT_COOKIE}=${fazendaId}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearTenantId() {
  document.cookie = `${TENANT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
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
