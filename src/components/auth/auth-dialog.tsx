"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { useLocale } from "next-intl"
import { Heart } from "lucide-react"
import { useAppDispatch } from "@/state/hooks"
import { productsApi } from "@/state/api/products-api-slice"
import { wishlistApi } from "@/state/api/wishlist-api-slice"
import { cartApi } from "@/state/api/cart-api-slice"

export type AuthDialogMode = "login" | "register"

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: AuthDialogMode
}

export function AuthDialog({ open, onOpenChange, defaultMode = "login" }: AuthDialogProps) {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const dispatch = useAppDispatch()

  const handleAuthSuccess = () => {
    // Invalidate all relevant queries to refetch with authenticated state
    dispatch(productsApi.util.invalidateTags(['Products']))
    dispatch(wishlistApi.util.invalidateTags(['Wishlist']))
    dispatch(cartApi.util.invalidateTags(['Cart']))
    
    // Close the dialog
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-xl md:max-w-2xl p-0 overflow-hidden rounded-2xl border bg-background shadow-xl max-h-[calc(100dvh-1.5rem)]"
      >
        <div className={isArabic ? "font-arabic" : ""} dir={isArabic ? "rtl" : "ltr"}>
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-b bg-muted/20">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 border border-red-100 shadow-sm">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                  Connectez-vous pour sauvegarder vos produits préférés
                </p>
                <p className="text-[12px] sm:text-sm text-muted-foreground mt-1">
                  Accédez à votre wishlist et suivez vos commandes.
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="px-5 sm:px-6 pb-5 sm:pb-6 max-h-[calc(100dvh-220px)] sm:max-h-[calc(100dvh-240px)]">
            <div className="pt-5">
              {defaultMode === "login" ? (
                <LoginForm skipRedirect onSuccess={handleAuthSuccess} />
              ) : (
                <RegisterForm skipRedirect onSuccess={handleAuthSuccess} />
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
