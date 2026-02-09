"use client"

import { AccountSidebar } from "@/components/account/account-sidebar"
import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RemiseBalance } from "@/components/ui/remise-balance"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { useRequestArtisanMutation, useUpdateProfileMutation } from "@/state/api/auth-api-slice"
import { setUser } from "@/state/slices/user-slice"
import { toast } from "@/hooks/use-toast"
import { Calendar, Mail, MapPin, Phone, Package, UserCircle2, LogIn, Building2, Hash, Globe, Save, X, Edit2, CheckCircle2, Settings, ShieldCheck, Clock, BadgePercent } from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useMemo, useState, useEffect } from "react"

const PHONE_COUNTRIES = [
  { code: "MA", dialCode: "+212" },
  { code: "FR", dialCode: "+33" },
  { code: "ES", dialCode: "+34" },
  { code: "DE", dialCode: "+49" },
  { code: "IT", dialCode: "+39" },
  { code: "GB", dialCode: "+44" },
  { code: "BE", dialCode: "+32" },
  { code: "NL", dialCode: "+31" },
  { code: "CH", dialCode: "+41" },
  { code: "PT", dialCode: "+351" },
  { code: "DZ", dialCode: "+213" },
  { code: "TN", dialCode: "+216" },
  { code: "EG", dialCode: "+20" },
  { code: "SA", dialCode: "+966" },
  { code: "AE", dialCode: "+971" },
  { code: "US", dialCode: "+1" },
  { code: "CA", dialCode: "+1" },
  { code: "TR", dialCode: "+90" },
  { code: "SE", dialCode: "+46" },
  { code: "NO", dialCode: "+47" },
]

export default function ProfilePage() {
  const locale = useLocale()
  const t = useTranslations('profile')
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.user)
  const isAuthLoading = !!accessToken && !user
  
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [requestArtisan, { isLoading: isRequestingArtisan }] = useRequestArtisanMutation()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])
  const [localPhoneNumber, setLocalPhoneNumber] = useState("")
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    adresse: "",
    societe: "",
    ice: "",
    shipping_address_line1: "",
    shipping_address_line2: "",
    shipping_city: "",
    shipping_state: "",
    shipping_postal_code: "",
    shipping_country: "",
  })

  const [initialSnapshot, setInitialSnapshot] = useState<string>("")

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' })
    } catch {
      return null
    }
  }, [locale])

  const getRegionName = useCallback(
    (code: string) => {
      return regionNames?.of(code) || code
    },
    [regionNames]
  )

  const getLanguageLabel = useCallback(
    (value: string | null | undefined) => {
      const key = (value || '').toLowerCase()
      if (key === 'ar') return t('languages.ar')
      if (key === 'en') return t('languages.en')
      if (key === 'zh') return t('languages.zh')
      return t('languages.fr')
    },
    [t]
  )

  const getAccountTypeLabel = useCallback(
    (value: string | null | undefined) => {
      if (!value) return t('accountTypes.client')
      if (value === 'Artisan/Promoteur') return t('accountTypes.artisan')
      if (value.toLowerCase() === 'client') return t('accountTypes.client')
      return value
    },
    [t]
  )

  const hasChanges = useMemo(() => {
    if (!isEditing) return false
    if (!initialSnapshot) return true
    return JSON.stringify(formData) !== initialSnapshot
  }, [formData, initialSnapshot, isEditing])

  // Parse phone number to extract country code and local number
  useEffect(() => {
    if (!user?.telephone) return
    
    const telephone = user.telephone
    const matchedCountry = PHONE_COUNTRIES.find(country => 
      telephone.startsWith(country.dialCode)
    )
    
    if (matchedCountry) {
      setSelectedCountry(matchedCountry)
      const localNumber = telephone.slice(matchedCountry.dialCode.length)
      setLocalPhoneNumber(localNumber)
    } else {
      setLocalPhoneNumber(telephone)
    }
  }, [user?.telephone])

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      const next = {
        prenom: user.prenom || "",
        nom: user.nom || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        societe: user.societe || "",
        ice: user.ice || "",
        shipping_address_line1: user.shipping_address_line1 || "",
        shipping_address_line2: user.shipping_address_line2 || "",
        shipping_city: user.shipping_city || "",
        shipping_state: user.shipping_state || "",
        shipping_postal_code: user.shipping_postal_code || "",
        shipping_country: user.shipping_country || "Morocco",
      }
      setFormData(next)

      // Keep a stable baseline so we can avoid firing updateProfile when nothing changed.
      // Only refresh the baseline when NOT editing.
      if (!isEditing) {
        setInitialSnapshot(JSON.stringify(next))
      }
    }
  }, [user, isEditing])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info(t('toasts.noChanges.title'), {
        description: t('toasts.noChanges.desc'),
      })
      return
    }

    try {
      const result = await updateProfile(formData).unwrap()
      dispatch(setUser(result))
      toast.success(t('toasts.updated.title'), {
        description: t('toasts.updated.desc'),
      })
      setIsEditing(false)

      // New baseline after successful save
      setInitialSnapshot(JSON.stringify(formData))
    } catch (error: any) {
      toast.error(t('toasts.error.title'), {
        description: error?.data?.message || t('toasts.error.updateProfileFallback'),
      })
    }
  }

  const handleCancel = () => {
    if (user) {
      const next = {
        prenom: user.prenom || "",
        nom: user.nom || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        societe: user.societe || "",
        ice: user.ice || "",
        shipping_address_line1: user.shipping_address_line1 || "",
        shipping_address_line2: user.shipping_address_line2 || "",
        shipping_city: user.shipping_city || "",
        shipping_state: user.shipping_state || "",
        shipping_postal_code: user.shipping_postal_code || "",
        shipping_country: user.shipping_country || "Morocco",
      }
      setFormData(next)
      setInitialSnapshot(JSON.stringify(next))
    }
    setIsEditing(false)
  }

  const handleRequestArtisan = async () => {
    if (!user) return

    try {
      const result = await requestArtisan()
      const data: any = (result as any)?.data
      const err: any = (result as any)?.error

      if (!data) {
        throw err
      }

      // Optimistic local update so UI updates immediately.
      const partialUser = (data?.user || {}) as any
      dispatch(
        setUser({
          ...user,
          ...partialUser,
          demande_artisan: true,
          artisan_approuve: false,
        } as any)
      )

      toast.success("Demande envoyée", {
        description: data?.message || t('toasts.requestArtisan.sentFallback'),
      })
    } catch (error: any) {
      toast.error(t('toasts.error.title'), {
        description:
          error?.data?.message ||
          error?.error?.message ||
          error?.message ||
          t('toasts.error.requestArtisanFallback'),
      })
    }
  }

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <ShopPageLayout
        title={t('guest.layoutTitle')}
        subtitle={t('guest.layoutSubtitle')}
        icon="cart"
      >
        <div className="bg-card border border-border rounded-2xl p-6 max-w-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{t('guest.sessionRequiredTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('guest.sessionRequiredDesc')}
              </p>
              <div className="mt-4">
                <Link href={`/${locale}/login`}>
                  <Button className="text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    {t('guest.login')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ShopPageLayout>
    )
  }

  return (
    <ShopPageLayout
      title={t('layoutTitle')}
      subtitle={t('layoutSubtitle')}
      icon="cart"
      showHeader={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <AccountSidebar active="profile" />

        {/* Main content */}
        <section className="lg:col-span-3 space-y-4 lg:space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('headerTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('headerSubtitle')}</p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => {
                  // Capture baseline when entering edit mode
                  setInitialSnapshot(JSON.stringify(formData))
                  setIsEditing(true)
                }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {t('actions.edit')}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isUpdating}
                >
                  <X className="w-4 h-4" />
                    {t('actions.cancel')}
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 text-white"
                    disabled={isUpdating || !hasChanges}
                >
                  <Save className="w-4 h-4" />
                    {isUpdating ? t('actions.saving') : t('actions.save')}
                </Button>
              </div>
            )}
          </div>

          {/* Artisan status / request (keep in viewport) */}
          {user && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <BadgePercent className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{t('artisan.title')}</p>
                    {(user.artisan_approuve || user.type_compte === "Artisan/Promoteur") && (
                      <Badge variant="secondary" className="text-[10px]">{t('artisan.badges.approved')}</Badge>
                    )}
                    {!!user.demande_artisan && !user.artisan_approuve && user.type_compte !== "Artisan/Promoteur" && (
                      <Badge variant="secondary" className="text-[10px]">{t('artisan.badges.pending')}</Badge>
                    )}
                  </div>

                  {(user.artisan_approuve || user.type_compte === "Artisan/Promoteur") ? (
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('artisan.approvedTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('artisan.approvedDesc')}</p>
                      </div>
                    </div>
                  ) : user.demande_artisan ? (
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                          <p className="text-sm font-medium text-foreground">{t('artisan.pendingTitle')}</p>
                          <p className="text-xs text-muted-foreground">{t('artisan.pendingDesc')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                            {t('artisan.requestHint')}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          className="text-white"
                          onClick={handleRequestArtisan}
                          disabled={isRequestingArtisan || isEditing}
                        >
                              {isRequestingArtisan ? t('actions.sending') : t('artisan.requestAction')}
                        </Button>
                        {typeof user.remise_balance === "number" && user.remise_balance > 0 && (
                              <RemiseBalance balance={user.remise_balance} size="md" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remise Balance Card - if available */}
          {user?.remise_balance !== undefined && user.remise_balance > 0 && (
            <div className="bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t('remise.title')}</h3>
                  <p className="text-xs text-muted-foreground">{t('remise.desc')}</p>
                </div>
                <RemiseBalance balance={user.remise_balance} size="md" showLabel={false} />
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('sections.personal.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('sections.personal.subtitle')}</p>
              </div>
            </div>

            {isAuthLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <UserCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.firstName')}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.prenom}
                      onChange={(e) => handleInputChange("prenom", e.target.value)}
                      className="h-10"
                        placeholder={t('placeholders.firstName')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                          <p className="text-sm font-semibold text-foreground">{user?.prenom || t('notProvided')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <UserCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.lastName')}
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      className="h-10"
                        placeholder={t('placeholders.lastName')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                          <p className="text-sm font-semibold text-foreground">{user?.nom || t('notProvided')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.email')}
                    {user?.email_verified && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          {t('verified')}
                      </Badge>
                    )}
                  </Label>
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground break-all">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.phone')}
                  </Label>
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
                      <Select 
                        value={selectedCountry.code}
                        onValueChange={(code) => {
                          const found = PHONE_COUNTRIES.find((c) => c.code === code)
                          if (found) {
                            setSelectedCountry(found)
                            setFormData((prev) => ({
                              ...prev,
                              telephone: found.dialCode + localPhoneNumber,
                            }))
                          }
                        }}
                      >
                        <SelectTrigger className="h-10 bg-background border-input w-full">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <img 
                                src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                                  alt={getRegionName(selectedCountry.code)}
                                className="w-5 h-auto"
                              />
                              <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
                          {PHONE_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              <div className="flex items-center gap-3">
                                <img 
                                  src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                  srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                                  alt={getRegionName(country.code)}
                                  className="w-5 h-auto"
                                />
                                <span className="text-sm">{getRegionName(country.code)}</span>
                                <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value={localPhoneNumber}
                          onChange={(e) => {
                            const nextLocal = e.target.value
                            setLocalPhoneNumber(nextLocal)
                            setFormData((prev) => ({
                              ...prev,
                              telephone: selectedCountry.dialCode + nextLocal,
                            }))
                          }}
                        placeholder="612345678"
                        maxLength={15}
                        className="h-10"
                        type="tel"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {user?.telephone ? (
                          <>
                            <img 
                              src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                              srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                                  alt={getRegionName(selectedCountry.code)}
                              className="w-5 h-auto shrink-0"
                            />
                            <span className="text-primary">{selectedCountry.dialCode}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{localPhoneNumber || user.telephone.replace(selectedCountry.dialCode, '')}</span>
                          </>
                        ) : (
                                t('notProvided')
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.accountType')}
                  </Label>
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{getAccountTypeLabel(user?.type_compte)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                      {t('fields.language')}
                  </Label>
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{getLanguageLabel(user?.locale)}</p>
                  </div>
                </div>

                {user?.is_company && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {t('fields.company')}
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.societe}
                          onChange={(e) => handleInputChange("societe", e.target.value)}
                          className="h-10"
                            placeholder={t('placeholders.company')}
                        />
                      ) : (
                        <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                              <p className="text-sm font-semibold text-foreground">{user?.societe || t('notProvided')}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                        ICE
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.ice}
                          onChange={(e) => handleInputChange("ice", e.target.value)}
                          className="h-10"
                            placeholder={t('placeholders.ice')}
                        />
                      ) : (
                        <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                              <p className="text-sm font-semibold text-foreground">{user?.ice || t('notProvided')}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('sections.billing.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('sections.billing.subtitle')}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">{t('fields.address')}</Label>
              {isEditing ? (
                <Input
                  value={formData.adresse}
                  onChange={(e) => handleInputChange("adresse", e.target.value)}
                  className="h-10"
                  placeholder={t('placeholders.address')}
                />
              ) : (
                <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.adresse || t('notProvided')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('sections.shipping.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('sections.shipping.subtitle')}</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">{t('fields.shippingLine1')}</Label>
                {isEditing ? (
                  <Input
                    value={formData.shipping_address_line1}
                    onChange={(e) => handleInputChange("shipping_address_line1", e.target.value)}
                    className="h-10"
                    placeholder={t('placeholders.shippingLine1')}
                  />
                ) : (
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.shipping_address_line1 || t('notProvided')}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">{t('fields.shippingLine2')}</Label>
                {isEditing ? (
                  <Input
                    value={formData.shipping_address_line2}
                    onChange={(e) => handleInputChange("shipping_address_line2", e.target.value)}
                    className="h-10"
                    placeholder={t('placeholders.shippingLine2')}
                  />
                ) : (
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.shipping_address_line2 || "—"}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('fields.city')}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_city}
                      onChange={(e) => handleInputChange("shipping_city", e.target.value)}
                      className="h-10"
                      placeholder={t('placeholders.city')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                        <p className="text-sm font-semibold text-foreground">{user?.shipping_city || t('notProvided')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('fields.state')}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_state}
                      onChange={(e) => handleInputChange("shipping_state", e.target.value)}
                      className="h-10"
                      placeholder={t('placeholders.state')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.shipping_state || "—"}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('fields.postalCode')}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_postal_code}
                      onChange={(e) => handleInputChange("shipping_postal_code", e.target.value)}
                      className="h-10"
                      placeholder={t('placeholders.postalCode')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                        <p className="text-sm font-semibold text-foreground">{user?.shipping_postal_code || t('notProvided')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('fields.country')}</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_country}
                      onChange={(e) => handleInputChange("shipping_country", e.target.value)}
                      className="h-10"
                      placeholder={t('placeholders.country')}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.shipping_country || "Morocco"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('sections.status.title')}</h2>
                <p className="text-xs text-muted-foreground">{t('sections.status.subtitle')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('status.authProvider')}</p>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {user?.auth_provider || t('fields.email')}
                  </p>
                </div>
              </div>

              {user?.is_solde && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400">{t('status.eligibleBalanceTitle')}</p>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      {t('status.eligibleBalanceDesc')}
                    </p>
                  </div>
                </div>
              )}

              {user?.created_at && (
                <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('status.memberSince')}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(user.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              )}

              {user?.last_login_at && (
                <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('status.lastLogin')}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(user.last_login_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </ShopPageLayout>
  )
}
