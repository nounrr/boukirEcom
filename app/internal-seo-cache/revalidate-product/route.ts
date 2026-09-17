import { timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { productCacheTag } from '@/lib/seo/product'

export const dynamic = 'force-dynamic'

function sameSecret(received: string, expected: string): boolean {
  const left = Buffer.from(received)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function POST(request: Request) {
  const secret = process.env.ECOM_REVALIDATE_SECRET?.trim()
  const received = request.headers.get('x-revalidation-secret') ?? ''
  if (!secret || !sameSecret(received, secret)) {
    return NextResponse.json({ revalidated: false }, { status: 401 })
  }

  let body: { productId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ revalidated: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const productId = Number(body.productId)
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ revalidated: false, error: 'Invalid productId' }, { status: 400 })
  }

  // expire: 0 makes the following product request read the API instead of
  // serving stale-while-revalidate data. Other product cache entries survive.
  revalidateTag(productCacheTag(productId), { expire: 0 })
  revalidatePath('/[locale]/product/[id]', 'page')

  return NextResponse.json({ revalidated: true, productId })
}

