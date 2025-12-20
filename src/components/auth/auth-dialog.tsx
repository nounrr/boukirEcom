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
      <DialogContent className="sm:max-w-xl h-[90vh] py-4">
        <div className="flex items-center gap-3 px-2 pb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          </div>
          <div className="flex-1">
            <p className={`text-lg font-semibold text-foreground ${isArabic ? "font-arabic" : ""}`}>
              Connectez-vous pour sauvegarder vos produits préférés
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="pb-2">
            {defaultMode === "login" ? (
              <LoginForm skipRedirect onSuccess={handleAuthSuccess} />
            ) : (
              <RegisterForm skipRedirect onSuccess={handleAuthSuccess} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
