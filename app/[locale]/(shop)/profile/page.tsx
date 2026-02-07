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
import { useLocale } from "next-intl"
import { useMemo, useState, useEffect } from "react"

const PHONE_COUNTRIES = [
  { code: "MA", name: "Maroc", dialCode: "+212" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "ES", name: "Espagne", dialCode: "+34" },
  { code: "DE", name: "Allemagne", dialCode: "+49" },
  { code: "IT", name: "Italie", dialCode: "+39" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44" },
  { code: "BE", name: "Belgique", dialCode: "+32" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31" },
  { code: "CH", name: "Suisse", dialCode: "+41" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "DZ", name: "Algérie", dialCode: "+213" },
  { code: "TN", name: "Tunisie", dialCode: "+216" },
  { code: "EG", name: "Égypte", dialCode: "+20" },
  { code: "SA", name: "Arabie Saoudite", dialCode: "+966" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971" },
  { code: "US", name: "États-Unis", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "TR", name: "Turquie", dialCode: "+90" },
  { code: "SE", name: "Suède", dialCode: "+46" },
  { code: "NO", name: "Norvège", dialCode: "+47" },
]

export default function ProfilePage() {
  const locale = useLocale()
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
      toast.info("Aucune modification", {
        description: "Aucun champ n'a été modifié.",
      })
      return
    }

    try {
      const result = await updateProfile(formData).unwrap()
      dispatch(setUser(result))
      toast.success("Profil mis à jour", { 
        description: "Vos informations ont été enregistrées avec succès." 
      })
      setIsEditing(false)

      // New baseline after successful save
      setInitialSnapshot(JSON.stringify(formData))
    } catch (error: any) {
      toast.error("Erreur", { 
        description: error?.data?.message || "Impossible de mettre à jour le profil." 
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
        description: data?.message || "Elle sera validée par un administrateur.",
      })
    } catch (error: any) {
      toast.error("Erreur", {
        description:
          error?.data?.message ||
          error?.error?.message ||
          error?.message ||
          "Impossible d'envoyer la demande.",
      })
    }
  }

  if (!isAuthenticated && !isAuthLoading) {
    return (
      <ShopPageLayout
        title="Mon profil"
        subtitle="Connectez-vous pour accéder à votre compte"
        icon="cart"
      >
        <div className="bg-card border border-border rounded-2xl p-6 max-w-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Session requise</p>
              <p className="text-sm text-muted-foreground">
                Veuillez vous connecter pour voir votre profil et vos informations.
              </p>
              <div className="mt-4">
                <Link href={`/${locale}/login`}>
                  <Button className="text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
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
      title="Mon compte"
      subtitle="Gérez votre profil et vos préférences"
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
              <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
              <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
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
                Modifier
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
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="gap-2 text-white"
                    disabled={isUpdating || !hasChanges}
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? "Enregistrement..." : "Enregistrer"}
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
                    <p className="text-sm font-semibold text-foreground">Statut Artisan / Pro</p>
                    {(user.artisan_approuve || user.type_compte === "Artisan/Promoteur") && (
                      <Badge variant="secondary" className="text-[10px]">Validé</Badge>
                    )}
                    {!!user.demande_artisan && !user.artisan_approuve && user.type_compte !== "Artisan/Promoteur" && (
                      <Badge variant="secondary" className="text-[10px]">En attente</Badge>
                    )}
                  </div>

                  {(user.artisan_approuve || user.type_compte === "Artisan/Promoteur") ? (
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Vous êtes Artisan/Promoteur.</p>
                        <p className="text-xs text-muted-foreground">Votre compte bénéficie des avantages Artisan/Pro.</p>
                      </div>
                    </div>
                  ) : user.demande_artisan ? (
                    <div className="mt-2 flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Demande en cours de validation.</p>
                        <p className="text-xs text-muted-foreground">Un administrateur validera votre demande bientôt.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">
                        Demandez le statut Artisan/Pro pour accéder à plus d’avantages et augmenter vos gains de remise.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          className="text-white"
                          onClick={handleRequestArtisan}
                          disabled={isRequestingArtisan || isEditing}
                        >
                          {isRequestingArtisan ? "Envoi..." : "Demander le statut Artisan"}
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
                  <h3 className="text-sm font-semibold text-foreground mb-1">Votre solde remise</h3>
                  <p className="text-xs text-muted-foreground">Utilisez ce solde lors de vos prochaines commandes</p>
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
                <h2 className="text-base font-semibold text-foreground">Informations personnelles</h2>
                <p className="text-xs text-muted-foreground">Vos données d'identification</p>
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
                    Prénom
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.prenom}
                      onChange={(e) => handleInputChange("prenom", e.target.value)}
                      className="h-10"
                      placeholder="Votre prénom"
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.prenom || "Non renseigné"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <UserCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Nom
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      className="h-10"
                      placeholder="Votre nom"
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.nom || "Non renseigné"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    Email
                    {user?.email_verified && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                        Vérifié
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
                    Téléphone
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
                                alt={selectedCountry.name}
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
                                  alt={country.name}
                                  className="w-5 h-auto"
                                />
                                <span className="text-sm">{country.name}</span>
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
                              alt={selectedCountry.name}
                              className="w-5 h-auto shrink-0"
                            />
                            <span className="text-primary">{selectedCountry.dialCode}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{localPhoneNumber || user.telephone.replace(selectedCountry.dialCode, '')}</span>
                          </>
                        ) : (
                          "Non renseigné"
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Type de compte
                  </Label>
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.type_compte || "Client"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    Langue
                  </Label>
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.locale === "ar" ? "العربية" : "Français"}</p>
                  </div>
                </div>

                {user?.is_company && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        Société
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.societe}
                          onChange={(e) => handleInputChange("societe", e.target.value)}
                          className="h-10"
                          placeholder="Nom de la société"
                        />
                      ) : (
                        <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                          <p className="text-sm font-semibold text-foreground">{user?.societe || "Non renseigné"}</p>
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
                          placeholder="Numéro ICE"
                        />
                      ) : (
                        <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                          <p className="text-sm font-semibold text-foreground">{user?.ice || "Non renseigné"}</p>
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
                <h2 className="text-base font-semibold text-foreground">Adresse de facturation</h2>
                <p className="text-xs text-muted-foreground">Votre adresse principale</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Adresse</Label>
              {isEditing ? (
                <Input
                  value={formData.adresse}
                  onChange={(e) => handleInputChange("adresse", e.target.value)}
                  className="h-10"
                  placeholder="Votre adresse complète"
                />
              ) : (
                <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                  <p className="text-sm font-semibold text-foreground">{user?.adresse || "Non renseignée"}</p>
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
                <h2 className="text-base font-semibold text-foreground">Adresse de livraison</h2>
                <p className="text-xs text-muted-foreground">Où recevoir vos commandes</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Adresse ligne 1</Label>
                {isEditing ? (
                  <Input
                    value={formData.shipping_address_line1}
                    onChange={(e) => handleInputChange("shipping_address_line1", e.target.value)}
                    className="h-10"
                    placeholder="Rue, numéro, bâtiment"
                  />
                ) : (
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.shipping_address_line1 || "Non renseignée"}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Adresse ligne 2 (optionnel)</Label>
                {isEditing ? (
                  <Input
                    value={formData.shipping_address_line2}
                    onChange={(e) => handleInputChange("shipping_address_line2", e.target.value)}
                    className="h-10"
                    placeholder="Appartement, étage"
                  />
                ) : (
                  <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">{user?.shipping_address_line2 || "—"}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Ville</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_city}
                      onChange={(e) => handleInputChange("shipping_city", e.target.value)}
                      className="h-10"
                      placeholder="Ville"
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.shipping_city || "Non renseignée"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Région/État (optionnel)</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_state}
                      onChange={(e) => handleInputChange("shipping_state", e.target.value)}
                      className="h-10"
                      placeholder="Région"
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
                  <Label className="text-xs font-medium">Code postal</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_postal_code}
                      onChange={(e) => handleInputChange("shipping_postal_code", e.target.value)}
                      className="h-10"
                      placeholder="Code postal"
                    />
                  ) : (
                    <div className="rounded-xl border border-border/60 p-3 bg-muted/20">
                      <p className="text-sm font-semibold text-foreground">{user?.shipping_postal_code || "Non renseigné"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Pays</Label>
                  {isEditing ? (
                    <Input
                      value={formData.shipping_country}
                      onChange={(e) => handleInputChange("shipping_country", e.target.value)}
                      className="h-10"
                      placeholder="Pays"
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
                <h2 className="text-base font-semibold text-foreground">Statut du compte</h2>
                <p className="text-xs text-muted-foreground">Informations sur votre compte</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fournisseur d'auth</p>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {user?.auth_provider || "Email"}
                  </p>
                </div>
              </div>

              {user?.is_solde && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400">Éligible au solde</p>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      Achetez maintenant, payez plus tard
                    </p>
                  </div>
                </div>
              )}

              {user?.created_at && (
                <div className="flex items-start gap-3 rounded-xl border border-border/60 p-4">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Membre depuis</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
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
                    <p className="text-xs text-muted-foreground">Dernière connexion</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(user.last_login_at).toLocaleDateString("fr-FR", {
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
