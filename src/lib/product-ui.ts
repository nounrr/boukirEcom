/** Small UI helpers shared by product cards and the product page. */

const TEXTURES = ['/product-fallbacks/mineral.webp', '/product-fallbacks/metal.webp', '/product-fallbacks/wood.webp', '/product-fallbacks/tile.webp']

/** Deterministic material texture shown when a product has no usable photo. */
export function textureFor(seed: number | string) {
  let hash = 0
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TEXTURES[hash % TEXTURES.length]
}

/** Splits a price into integer and decimal parts using the locale's decimal mark. */
export function splitPrice(value: number, locale: string) {
  const fixed = (Number.isFinite(value) ? value : 0).toFixed(2)
  const [int, dec] = fixed.split('.')
  const tag = locale === 'ar' ? 'ar-MA' : locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-GB' : 'fr-FR'
  return { int: Number(int).toLocaleString(tag), dec, mark: locale === 'fr' ? ',' : '.' }
}

/** Animates a small copy of the product image into the header cart icon. */
export function flyToCart(source: HTMLElement | null, image: string) {
  if (typeof window === 'undefined' || !source) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-trigger]')).find((el) => el.offsetWidth > 0)
  if (!target) return
  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const size = Math.min(from.width, from.height, 320) * 0.7
  const ghost = document.createElement(image ? 'img' : 'div')
  if (image && ghost instanceof HTMLImageElement) ghost.src = image
  Object.assign(ghost.style, {
    position: 'fixed', zIndex: '9999', pointerEvents: 'none', objectFit: 'contain',
    left: `${from.left + (from.width - size) / 2}px`, top: `${from.top + (from.height - size) / 2}px`,
    width: `${size}px`, height: `${size}px`, borderRadius: '18px', background: '#fff',
    boxShadow: '0 20px 40px -12px rgba(242,159,4,0.6)',
  })
  document.body.appendChild(ghost)
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const anim = ghost.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 60}px) scale(0.55)`, opacity: 0.95, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0.3 },
    ],
    { duration: 780, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  )
  anim.onfinish = () => {
    ghost.remove()
    target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' })
  }
}
