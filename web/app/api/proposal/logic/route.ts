import { NextRequest } from 'next/server'
import { handleProposalStream } from '../_shared'
import { buildLogicSystemPrompt, buildLogicFirstContent, buildLogicFollowUp } from '@/lib/prompts/proposal-logic'

export async function POST(request: NextRequest) {
  return handleProposalStream(request, buildLogicSystemPrompt, buildLogicFirstContent, buildLogicFollowUp)
}
