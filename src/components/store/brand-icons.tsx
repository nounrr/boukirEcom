/** Logos des réseaux et des stores (SVG simples, sans dépendance). */
type IconProps = { className?: string }

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8.1v3h2.5V21h2.9Z" />
    </svg>
  )
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2.2A9.7 9.7 0 0 0 3.6 16.8L2.3 21.7l5-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.6 4.1 3.6 1.5.7 2.1.7 2.9.6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z" />
    </svg>
  )
}

export function AppleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-1.9c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9a4.8 4.8 0 0 0-4 2.4c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.4-3.9ZM14 5.4a4.2 4.2 0 0 0 1-3.1 4.3 4.3 0 0 0-2.8 1.4 4 4 0 0 0-1 3 3.6 3.6 0 0 0 2.8-1.3Z" />
    </svg>
  )
}

export function GooglePlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#34A853" d="M3.6 2.3 13.4 12 3.6 21.7a1.5 1.5 0 0 1-.6-1.2V3.5c0-.5.2-.9.6-1.2Z" />
      <path fill="#FBBC04" d="m16.7 8.7 3.6 2c.9.5.9 1.8 0 2.3l-3.6 2.1-3.3-3.1 3.3-3.3Z" />
      <path fill="#4285F4" d="M3.6 2.3c.4-.3 1-.4 1.6-.1l11.5 6.5-3.3 3.3-9.8-9.7Z" />
      <path fill="#EA4335" d="m13.4 12 3.3 3.1-11.5 6.6c-.6.3-1.2.2-1.6-.1L13.4 12Z" />
    </svg>
  )
}
