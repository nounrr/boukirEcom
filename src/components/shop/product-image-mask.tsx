'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ProductImageMaskProps {
  children: ReactNode
  className?: string
}

export function ProductImageMask({ children, className }: ProductImageMaskProps) {
  return (
    <div className={cn('relative aspect-square overflow-visible rounded-[22px]', className)}>
      <div className="absolute inset-2.5 sm:inset-3 rounded-[24px] overflow-hidden">
        {children}
      </div>
    </div>
  )
}
