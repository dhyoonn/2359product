const requests = new Map<string, number[]>()

// IP당 windowMs 밀리초 내에 maxRequests 횟수로 제한
// 사내 도구 기준: 일반 API 30회/분, 제안서(고비용) 15회/분
export function checkRateLimit(ip: string, maxRequests = 30, windowMs = 60_000): boolean {
  const now = Date.now()
  const prev = (requests.get(ip) ?? []).filter((t) => now - t < windowMs)
  if (prev.length >= maxRequests) return false
  requests.set(ip, [...prev, now])
  return true
}

export function getClientIp(request: Request): string {
  return (
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
