/**
 * Données de la page "Links" (linktree) Boukir Diamond Construction Store.
 *
 * Chaque membre a un lien court : /fr/p1, /fr/p2, /fr/p3.
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
    hint: "Laissez-nous un avis · Tanger",
    href: "https://g.page/r/CSduE66uwI36EAI/review",
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
    hint: "Taoufik Boukir · actualités & promos",
    href: "https://www.facebook.com/taoufik.mpc/",
  },
  {
    kind: "instagram",
    label: "Instagram",
    hint: "@boukirste · chantiers & nouveautés",
    href: "https://www.instagram.com/boukirste/",
  },
]

export const TEAM: TeamMember[] = [
  {
    slug: "p1",
    firstName: "Taoufik",
    lastName: "Boukir",
    role: "Directeur",
    roleAr: "المدير",
    phone: "+212 650-812894",
    whatsapp: "212650812894",
    email: "",
    initials: "TB",
  },
  {
    slug: "p2",
    firstName: "Anas",
    lastName: "Boukir",
    role: "Gérant",
    roleAr: "المسير",
    phone: "+212 616-042023",
    whatsapp: "212616042023",
    email: "",
    initials: "AB",
  },
  {
    slug: "p3",
    firstName: "Oussama",
    lastName: "Boukir",
    role: "Conseiller commercial",
    roleAr: "مستشار تجاري",
    phone: "+212 666-216657",
    whatsapp: "212666216657",
    email: "",
    initials: "OB",
  },
]

export const DEFAULT_MEMBER = TEAM[0]

export function findMember(slug?: string | null): TeamMember | undefined {
  if (!slug) return undefined
  return TEAM.find((m) => m.slug === slug.toLowerCase())
}
