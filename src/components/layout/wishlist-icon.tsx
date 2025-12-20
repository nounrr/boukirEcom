"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetWishlistQuery } from "@/state/api/wishlist-api-slice"
import { Heart } from "lucide-react"
import { useLocale } from "next-intl"
import Link from "next/link"
import { useAppSelector } from "@/state/hooks"

export function WishlistIcon() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  
  // Fetch wishlist only if authenticated
  const { data: wishlist } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  })
  
  const itemCount = wishlist?.summary?.totalItems || 0

  return (
    <Link href={`/${locale}/wishlist`} className="group">
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative hover:bg-muted/50 transition-all duration-200 h-9 w-9"
      >
        <Heart className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        <Badge className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 h-4.5 w-4.5 flex items-center justify-center p-0 text-[10px] font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200 border border-background">
          {itemCount}
        </Badge>
      </Button>
    </Link>
  )
}
