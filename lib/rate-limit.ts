// ponytail: in-memory fixed-window limiter. Per serverless instance, resets on
// cold start, not shared across instances — it slows casual abuse but won't stop
// a determined attacker. Upgrade to Upstash Redis or Vercel WAF if needed (see
// docs/superpowers/specs/2026-07-14-security-remediation-design.md follow-ups).
const hits = new Map<string, number[]>()

// Returns true if the request is allowed, false if the key is over its limit.
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  hits.set(key, recent)
  if (recent.length >= limit) return false
  recent.push(now)
  return true
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
}
