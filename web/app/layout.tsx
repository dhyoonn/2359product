import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '기획팀 문서 자동화',
  description: '상품기획팀 문서 자동화 도구',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-800">{children}</body>
    </html>
  )
}
