/**
 * Safe API client that handles both full-stack Express server and static Firebase Hosting environments.
 * Prevents "Unexpected token '<', '<!DOCTYPE ...' is not valid JSON" errors when routes are rewritten to index.html.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlResponse?: boolean;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(input, init);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data,
          error: !res.ok ? (data?.error || data?.message || `Erreur HTTP ${res.status}`) : undefined
        };
      } catch (parseErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: parseErr?.message || 'Erreur d\'analyse JSON'
        };
      }
    }

    // Response is HTML (e.g. Firebase Hosting rewrite to index.html)
    return {
      ok: false,
      status: res.status,
      data: null,
      isHtmlResponse: true,
      error: 'STATIC_HOSTING_ENDPOINT_UNAVAILABLE'
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr?.message || 'Erreur réseau de connexion'
    };
  }
}
