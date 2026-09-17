/**
 * Données de la page "Links" (linktree) Boukir Diamond Construction Store.
 *
 * ⚠️ Données fictives pour le moment : à remplacer par les vraies personnes,
 * numéros et URLs avant mise en production.
 */

export type LinkKind = "maps" | "website" | "facebook" | "instagram"

export type SocialLink = {
  kind: LinkKind
  label: string
  hint: string
  href: string
}

export type TeamMember = {
  slug: string
  firstName: string
  lastName: string
  role: string
  roleAr?: string
  phone: string
  whatsapp: string
  email: string
  /** Couleur d'accent des initiales (dégradé or par défaut) */
  initials: string
}

export const COMPANY = {
  name: "Boukir",
  tagline: "Diamond Construction Store",
  city: "Tanger",
  since: "2024",
  hours: "Lun – Sam · 08h00 – 19h00",
  logo: "/logo.png",
  /**
   * Photo de fond (Unsplash, licence libre) : grues de chantier au crépuscule.
   * https://unsplash.com/photos/a-group-of-cranes-are-silhouetted-against-the-evening-sky
   * Pour une copie locale : télécharger l'image dans /public/links/bg.jpg et
   * remplacer l'URL ci-dessous par "/links/bg.jpg".
   */
  background:
    "https://images.unsplash.com/photo-1636714289409-e06a4dfc617c?auto=format&fit=crop&w=2000&q=80",
} as const

/** Ordre imposé : Google Maps → Site web → Facebook → Instagram */
export const COMPANY_LINKS: SocialLink[] = [
  {
    kind: "maps",
    label: "Google Maps",
    hint: "Itinéraire vers la droguerie · Tanger",
    href: "https://www.google.com/maps/search/?api=1&query=Boukir+Diamond+Construction+Store+Tanger",
  },
  {
    kind: "website",
    label: "Site web",
    hint: "boukirdiamond.com · catalogue & commandes",
    href: "https://boukirdiamond.com",
  },
  {
    kind: "facebook",
    label: "Facebook",
    hint: "@boukirdiamond · actualités & promos",
    href: "https://www.facebook.com/boukirdiamond",
  },
  {
    kind: "instagram",
    label: "Instagram",
    hint: "@boukirdiamond · chantiers & nouveautés",
    href: "https://www.instagram.com/boukirdiamond",
  },
]

export const TEAM: TeamMember[] = [
  {
    slug: "youssef-boukir",
    firstName: "Youssef",
    lastName: "Boukir",
    role: "Directeur Général",
    roleAr: "المدير العام",
    phone: "+212 6 61 00 00 01",
    whatsapp: "212661000001",
    email: "y.boukir@boukirdiamond.com",
    initials: "YB",
  },
  {
    slug: "salma-el-amrani",
    firstName: "Salma",
    lastName: "El Amrani",
    role: "Responsable Commerciale",
    roleAr: "مسؤولة تجارية",
    phone: "+212 6 61 00 00 02",
    whatsapp: "212661000002",
    email: "s.elamrani@boukirdiamond.com",
    initials: "SE",
  },
  {
    slug: "mehdi-tazi",
    firstName: "Mehdi",
    lastName: "Tazi",
    role: "Chef de Dépôt & Logistique",
    roleAr: "رئيس المستودع واللوجستيك",
    phone: "+212 6 61 00 00 03",
    whatsapp: "212661000003",
    email: "m.tazi@boukirdiamond.com",
    initials: "MT",
  },
  {
    slug: "imane-bennani",
    firstName: "Imane",
    lastName: "Bennani",
    role: "Conseillère Technique Matériaux",
    roleAr: "مستشارة تقنية للمواد",
    phone: "+212 6 61 00 00 04",
    whatsapp: "212661000004",
    email: "i.bennani@boukirdiamond.com",
    initials: "IB",
  },
]

export const DEFAULT_MEMBER = TEAM[0]

export function findMember(slug?: string | null): TeamMember | undefined {
  if (!slug) return undefined
  return TEAM.find((m) => m.slug === slug.toLowerCase())
}
