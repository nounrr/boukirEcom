"use client"

import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/state/hooks"
import { Heart, Package, Settings, UserCircle2 } from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { API_CONFIG } from "@/lib/api-config"

interface AccountSidebarProps {
  active?: "profile" | "orders" | "wishlist" | "settings"
}

export function AccountSidebar({ active = "profile" }: AccountSidebarProps) {
  const locale = useLocale()
  const { user, accessToken } = useAppSelector((state) => state.user)
  const isAuthLoading = !!accessToken && !user

  return (
    <aside className="lg:col-span-1">
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        {isAuthLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-3 w-40 rounded bg-muted animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border bg-muted">
              {user?.avatar_url ? (
                  <img
                    src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_CONFIG.BASE_URL}${user.avatar_url}`}
                    alt={user.prenom || user.email}
                    className="object-cover w-full h-full"
                    referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                  {user?.prenom?.[0]?.toUpperCase() || user?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <p className="mt-3 text-base font-semibold text-foreground">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-muted-foreground break-all">{user?.email}</p>
            <Badge className="mt-3" variant="secondary">Compte actif</Badge>
          </div>
        )}

        <div className="mt-5 space-y-2">
          <Link
            href={`/${locale}/profile`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === "profile" ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted/50"}`}
          >
            <UserCircle2 className="w-4 h-4" />
            Mon profil
          </Link>
          <Link
            href={`/${locale}/orders`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === "orders" ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted/50"}`}
          >
            <Package className="w-4 h-4" />
            Mes commandes
          </Link>
          <Link
            href={`/${locale}/wishlist`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === "wishlist" ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted/50"}`}
          >
            <Heart className="w-4 h-4" />
            Favoris
          </Link>
          <Link
            href={`/${locale}/settings`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active === "settings" ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted/50"}`}
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Link>
        </div>
      </div>
    </aside>
  )
}
