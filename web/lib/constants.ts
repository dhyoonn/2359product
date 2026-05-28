// ── AI 모델 설정 ──────────────────────────────────────────────────
// 모델을 바꿀 때 이 파일만 수정하면 전체 적용됨

// 출력량 적은 기능 (개발의뢰서, 제품사양서) — 비용 절감
export const MODEL_STANDARD = 'claude-sonnet-4-5' as const

// 출력량 많은 기능 (제안서, 최종기획안, 상세페이지, 로직발굴)
export const MODEL_LARGE = 'claude-sonnet-4-6' as const

// ── 로깅 ──────────────────────────────────────────────────────────
// 서버 로그에만 기록 (브라우저 노출 없음). 배포 후에도 유지해서 비용 모니터링에 활용
export const LOG_ENABLED = true

export function logTokenUsage(tag: string, input: number, output: number) {
  if (!LOG_ENABLED) return
  const costUSD = (input * 3 + output * 15) / 1_000_000
  console.log(
    `[${tag}] input: ${input.toLocaleString()} | output: ${output.toLocaleString()}` +
    ` | 비용: $${costUSD.toFixed(4)} (≈ ₩${Math.round(costUSD * 1380)})`
  )
}

// ── 파일 크기 제한 ─────────────────────────────────────────────────
export const MAX_FILE_SIZE_DEFAULT = 10 * 1024 * 1024  // 10MB — 개발의뢰서, 제품사양서 등
export const MAX_FILE_SIZE_LARGE   = 20 * 1024 * 1024  // 20MB — 상세페이지 레퍼런스
