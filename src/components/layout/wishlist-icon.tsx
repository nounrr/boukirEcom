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

export function WishlistIcon({ tone = "default" }: { tone?: "default" | "onPrimary" }) {
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
        className={cn(
          "relative transition-all duration-200 h-9 w-9",
          tone === "onPrimary" ? "hover:bg-white/10" : "hover:bg-muted/50",
        )}
      >
        <Heart
          className={cn(
            "w-4.5 h-4.5 transition-colors duration-200",
            tone === "onPrimary" ? "text-white/85 group-hover:text-white" : "text-muted-foreground group-hover:text-foreground",
          )}
        />
        {itemCount > 0 && (
          <Badge
            className={cn(
              "pointer-events-none absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 h-4.5 w-4.5 flex items-center justify-center p-0 text-[10px] font-semibold shadow-md group-hover:scale-105 transition-all duration-200",
              tone === "onPrimary"
                ? "bg-white text-primary border border-white/70 shadow-black/10 hover:bg-white/90 hover:border-white/90 hover:shadow-black/20 group-hover:bg-white/90 group-hover:border-white/90 group-hover:shadow-black/20"
                : "bg-primary text-primary-foreground shadow-primary/20 border border-background hover:bg-primary/90 hover:shadow-primary/30 group-hover:bg-primary/90 group-hover:shadow-primary/30",
              isAnimating && "animate-bounce scale-125"
            )}
          >
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
