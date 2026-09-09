import { sitemapResponse } from '@/lib/seo/sitemap-publication'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  return sitemapResponse((await params).file)
}
