type MaalemAccountUser = {
  type_compte?: string
  artisan_approuve?: boolean | number
  demande_artisan?: boolean | number
  maalem_profile?: { status?: string } | null
} | null | undefined

// Navigation only; operational access is checked again by the server.
export function isApprovedMaalem(user: MaalemAccountUser): boolean {
  return user?.maalem_profile?.status === 'approved'
}

export function maalemAccountEntry(user: MaalemAccountUser): 'workspace' | 'application' | 'join' | null {
  if (!user) return null
  if (isApprovedMaalem(user)) return 'workspace'
  if (user.maalem_profile) return 'application'
  if (['Artisan', 'Promoteur', 'Artisan/Promoteur'].includes(user.type_compte || '') || user.artisan_approuve === true || Number(user.artisan_approuve) === 1) return 'join'
  return null
}
