import { NextRequest } from 'next/server'
import { handleProposalStream } from '../_shared'
import { buildFinalSystemPrompt, buildFinalFirstContent, buildFinalFollowUp } from '@/lib/prompts/proposal-final'

export async function POST(request: NextRequest) {
  return handleProposalStream(request, buildFinalSystemPrompt, buildFinalFirstContent, buildFinalFollowUp)
}
