export function buildMaalemProfileJsonLd({
  profileUrl,
  publicName,
  photoUrl,
  category,
  skills,
  interventionAreas,
  averageRating,
  reviewCount,
  ratedServiceName,
}: {
  profileUrl: string
  publicName: string
  photoUrl: string | null
  category: string | null
  skills: string[]
  interventionAreas: string[]
  averageRating: number | null
  reviewCount: number
  ratedServiceName: string
}) {
  const personId = `${profileUrl}#maalem`
  const graph: Array<Record<string, unknown>> = [
    { '@type': 'ProfilePage', url: profileUrl, mainEntity: { '@id': personId } },
    {
      '@type': 'Person',
      '@id': personId,
      name: publicName,
      image: photoUrl || undefined,
      jobTitle: category || undefined,
      knowsAbout: skills,
      url: profileUrl,
    },
  ]

  if (reviewCount > 0 && averageRating != null) {
    graph.push({
      '@type': 'Service',
      name: ratedServiceName,
      provider: { '@id': personId },
      url: profileUrl,
      areaServed: interventionAreas,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating,
        reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    })
  }

  return { '@context': 'https://schema.org', '@graph': graph }
}
