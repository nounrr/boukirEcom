/**
 * Photos et vidéos du magasin Boukir Diamond (Tanger), prises sur place le 22/10/2026.
 * Fichiers optimisés dans public/store (photos WebP 1600 px, vidéos 10 s sans son).
 */

export type StorePhoto = { src: string; width: number; height: number; wide?: boolean }
export type StoreVideo = { key: 'facade' | 'entree' | 'rayons' | 'carrelage' | 'showroom' | 'sika'; src: string; poster: string; portrait: boolean }

export const STORE_PHOTOS: StorePhoto[] = [
  { src: '/store/photos/magasin-01.webp', width: 1600, height: 1200, wide: true },
  { src: '/store/photos/magasin-02.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-03.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-04.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-05.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-06.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-07.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-08.webp', width: 1600, height: 1200, wide: true },
  { src: '/store/photos/magasin-09.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-10.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-11.webp', width: 1600, height: 1200, wide: true },
  { src: '/store/photos/magasin-12.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-13.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-14.webp', width: 1600, height: 1200 },
  { src: '/store/photos/magasin-15.webp', width: 1200, height: 1600 },
  { src: '/store/photos/magasin-16.webp', width: 1600, height: 1200 },
]

export const STORE_VIDEOS: StoreVideo[] = [
  { key: 'showroom', src: '/store/videos/showroom.mp4', poster: '/store/videos/showroom-poster.webp', portrait: false },
  { key: 'entree', src: '/store/videos/allee.mp4', poster: '/store/videos/allee-poster.webp', portrait: true },
  { key: 'rayons', src: '/store/videos/rayons.mp4', poster: '/store/videos/rayons-poster.webp', portrait: false },
  { key: 'sika', src: '/store/videos/sika.mp4', poster: '/store/videos/sika-poster.webp', portrait: true },
  { key: 'facade', src: '/store/videos/facade.mp4', poster: '/store/videos/facade-poster.webp', portrait: false },
  { key: 'carrelage', src: '/store/videos/carrelage.mp4', poster: '/store/videos/carrelage-poster.webp', portrait: false },
]

/**
 * Liens de l'application mobile. Vides tant que l'application n'est pas publiée :
 * les boutons affichent alors « Bientôt disponible ». À renseigner dans l'environnement
 * (NEXT_PUBLIC_APP_STORE_URL, NEXT_PUBLIC_PLAY_STORE_URL) dès la publication.
 */
export const MOBILE_APP = {
  name: 'Boukir Diamond',
  appStoreUrl: (process.env.NEXT_PUBLIC_APP_STORE_URL || '').trim() || null,
  playStoreUrl: (process.env.NEXT_PUBLIC_PLAY_STORE_URL || '').trim() || null,
} as const
