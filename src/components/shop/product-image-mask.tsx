'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ProductImageMaskProps {
  children: ReactNode
  className?: string
}

export function ProductImageMask({
  children,
  className
}: ProductImageMaskProps) {
  return (
    <div
      className={cn(
        'relative aspect-square bg-muted overflow-visible rounded-t-2xl',
        className
      )}
    >
      {children}
    </div>
  )
}
