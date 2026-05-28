import { Client } from '@notionhq/client'
import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

export function extractPageId(url: string): string | null {
  const match = url.match(/([a-f0-9]{32})(?:[?#]|$)/)
  if (match) return match[1]
  const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)
  if (uuidMatch) return uuidMatch[1].replace(/-/g, '')
  return null
}

function richTextToString(richText: RichTextItemResponse[]): string {
  return richText.map((t) => t.plain_text).join('')
}

function blockToText(block: BlockObjectResponse): string {
  const b = block as Record<string, unknown>
  const getTexts = (key: string): string => {
    const content = (b[key] as Record<string, unknown>)?.rich_text as RichTextItemResponse[] | undefined
    return content ? richTextToString(content) : ''
  }
  switch (block.type) {
    case 'paragraph': return getTexts('paragraph')
    case 'heading_1': return `# ${getTexts('heading_1')}`
    case 'heading_2': return `## ${getTexts('heading_2')}`
    case 'heading_3': return `### ${getTexts('heading_3')}`
    case 'bulleted_list_item': return `• ${getTexts('bulleted_list_item')}`
    case 'numbered_list_item': return `- ${getTexts('numbered_list_item')}`
    case 'quote': return getTexts('quote')
    case 'callout': return getTexts('callout')
    case 'toggle': return getTexts('toggle')
    default: return ''
  }
}

export async function fetchNotionPageText(url: string): Promise<{ title: string; text: string }> {
  const pageId = extractPageId(url)
  if (!pageId) throw new Error('올바른 노션 페이지 URL이 아닙니다.')

  const page = await notion.pages.retrieve({ page_id: pageId })
  const props = (page as Record<string, unknown>).properties as Record<string, Record<string, unknown>>
  const titleProp = Object.values(props).find((p) => p.type === 'title')
  const titleArr = titleProp?.title as RichTextItemResponse[] | undefined
  const title = titleArr ? richTextToString(titleArr) : '노션 페이지'

  const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 })
  const lines = blocks.results
    .filter((b): b is BlockObjectResponse => 'type' in b)
    .map(blockToText)
    .filter(Boolean)

  return { title, text: lines.join('\n') }
}
