import { NextRequest } from 'next/server'
import { handleProposalStream } from '../_shared'
import { buildMarketingSystemPrompt, buildMarketingFirstContent, buildMarketingFollowUp } from '@/lib/prompts/proposal-marketing'

export async function POST(request: NextRequest) {
  return handleProposalStream(request, buildMarketingSystemPrompt, buildMarketingFirstContent, buildMarketingFollowUp)
}
