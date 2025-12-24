"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetWishlistQuery } from "@/state/api/wishlist-api-slice"
import { Heart } from "lucide-react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useAppSelector } from "@/state/hooks"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function WishlistIcon() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const [prevCount, setPrevCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Fetch wishlist only if authenticated - with auto-refetch on focus/reconnect
  const { data: wishlist } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
    // Automatically refetch when window regains focus or network reconnects
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })
  
  const itemCount = wishlist?.summary?.totalItems || 0

  // Animate badge when count changes
  useEffect(() => {
    if (itemCount !== prevCount && prevCount !== 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevCount(itemCount)
  }, [itemCount, prevCount])

  return (
    <Link href={`/${locale}/wishlist`} className="group">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-muted/50 transition-all duration-200 h-9 w-9"
      >
        <Heart className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        <Badge className={cn(
          "absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 h-4.5 w-4.5 flex items-center justify-center p-0 text-[10px] font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-all duration-200 border border-background",
          isAnimating && "animate-bounce scale-125"
        )}>
          {itemCount}
        </Badge>
      </Button>
    </Link>
  )
}
