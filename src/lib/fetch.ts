/**
 * Create a fetch wrapper that strips headers which break browser CORS:
 * - `x-stainless-*`: OpenAI SDK telemetry (not in server allow-list)
 * - `access-control-*`: @x402/fetch bug — sets Access-Control-Expose-Headers
 *   as a REQUEST header (it's response-only), causing preflight rejection
 */
export function createSanitizedFetch(
  baseFetch: typeof globalThis.fetch = globalThis.fetch,
): typeof globalThis.fetch {
  return (input, init) => {
    const req = new Request(input, init)
    for (const key of [...req.headers.keys()]) {
      if (key.startsWith('x-stainless') || key.startsWith('access-control')) {
        req.headers.delete(key)
      }
    }
    return baseFetch(req)
  }
}
