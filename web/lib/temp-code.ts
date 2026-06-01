import crypto from 'crypto'

function getKSTDateString(): string {
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
}

export function getTodayTempCode(): string {
  const secret = process.env.TEMP_PASSWORD_SECRET
  if (!secret) return ''
  const hash = crypto.createHash('sha256').update(secret + getKSTDateString()).digest('hex')
  return (parseInt(hash.slice(0, 8), 16) % 1000000).toString().padStart(6, '0')
}
