"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { motion, useReducedMotion } from "framer-motion"
import {
  Check,
  ChevronRight,
  Facebook,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react"

import { Link } from "@/i18n/routing"
import type { AppLocale } from "@/i18n/locale"
import {
  COMPANY,
  type LinkKind,
  type SocialLink,
  type TeamMember,
} from "@/lib/links/team"

import {
  Bricks,
  Bucket,
  CementBag,
  CircularSaw,
  DiamondDisc,
  Drill,
  Gem,
  Grinder,
  HandSaw,
  Helmet,
  Rebar,
  SandPile,
  SteelDisc,
  Trowel,
} from "./construction-icons"
import styles from "./linktree.module.css"

/* ------------------------------------------------------------------ */
/* Textes                                                              */
/* ------------------------------------------------------------------ */

const COPY: Record<AppLocale, {
  open: string
  team: string
  share: string
  copied: string
  call: string
  whatsapp: string
  footer: string
  marquee: string[]
}> = {
  fr: {
    open: "Ouvert",
    team: "Notre équipe",
    share: "Partager cette page",
    copied: "Lien copié",
    call: "Appeler",
    whatsapp: "WhatsApp",
    footer: "Droguerie · Matériaux de construction · Outillage",
    marquee: ["Sable", "Ciment", "Disque diamant", "Disque acier", "Scie", "Truelle", "Briques", "Fer à béton", "Meuleuse", "Perceuse", "Peinture", "Plomberie"],
  },
  en: {
    open: "Open",
    team: "Our team",
    share: "Share this page",
    copied: "Link copied",
    call: "Call",
    whatsapp: "WhatsApp",
    footer: "Hardware · Building materials · Tools",
    marquee: ["Sand", "Cement", "Diamond disc", "Steel disc", "Saw", "Trowel", "Bricks", "Rebar", "Grinder", "Drill", "Paint", "Plumbing"],
  },
  ar: {
    open: "مفتوح",
    team: "فريقنا",
    share: "مشاركة الصفحة",
    copied: "تم نسخ الرابط",
    call: "اتصال",
    whatsapp: "واتساب",
    footer: "دروكري · مواد البناء · عدة",
    marquee: ["رمل", "إسمنت", "قرص ألماس", "قرص فولاذ", "منشار", "مالج", "طوب", "حديد التسليح", "مطحنة", "مثقاب", "صباغة", "سباكة"],
  },
  zh: {
    open: "营业中",
    team: "我们的团队",
    share: "分享页面",
    copied: "链接已复制",
    call: "致电",
    whatsapp: "WhatsApp",
    footer: "五金 · 建材 · 工具",
    marquee: ["沙子", "水泥", "金刚石锯片", "钢锯片", "锯", "抹刀", "砖", "钢筋", "角磨机", "电钻", "油漆", "水暖"],
  },
}

const ICONS: Record<LinkKind, React.ComponentType<{ className?: string }>> = {
  maps: MapPin,
  website: Globe,
  facebook: Facebook,
  instagram: Instagram,
}

/* ------------------------------------------------------------------ */
/* Décor : outils & matériaux flottants                                */
/* ------------------------------------------------------------------ */

type ToolSpec = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  left: string
  top: string
  size: number
  alpha: number
  depth: number
  dur: number
  delay: number
  tilt: number
  spin?: boolean
  hideMobile?: boolean
}

const TOOLS: ToolSpec[] = [
  { Icon: DiamondDisc, left: "4%",  top: "8%",  size: 150, alpha: 0.30, depth: 28, dur: 40, delay: 0,  tilt: 0,  spin: true },
  { Icon: CementBag,   left: "86%", top: "6%",  size: 120, alpha: 0.26, depth: 18, dur: 10, delay: -2, tilt: -8 },
  { Icon: SandPile,    left: "70%", top: "80%", size: 150, alpha: 0.24, depth: 14, dur: 12, delay: -4, tilt: 3 },
  { Icon: SteelDisc,   left: "90%", top: "48%", size: 120, alpha: 0.28, depth: 34, dur: 55, delay: 0,  tilt: 0,  spin: true, hideMobile: true },
  { Icon: CircularSaw, left: "18%", top: "76%", size: 130, alpha: 0.28, depth: 22, dur: 32, delay: 0,  tilt: 0,  spin: true },
  { Icon: HandSaw,     left: "42%", top: "3%",  size: 120, alpha: 0.22, depth: 12, dur: 11, delay: -1, tilt: -14, hideMobile: true },
  { Icon: Trowel,      left: "2%",  top: "44%", size: 90,  alpha: 0.24, depth: 24, dur: 9,  delay: -3, tilt: 10 },
  { Icon: Bricks,      left: "56%", top: "88%", size: 96,  alpha: 0.22, depth: 16, dur: 13, delay: -5, tilt: -4 },
  { Icon: Grinder,     left: "62%", top: "16%", size: 100, alpha: 0.22, depth: 30, dur: 10, delay: -6, tilt: 12, hideMobile: true },
  { Icon: Rebar,       left: "34%", top: "90%", size: 110, alpha: 0.20, depth: 10, dur: 14, delay: -2, tilt: 5,  hideMobile: true },
  { Icon: Bucket,      left: "12%", top: "26%", size: 70,  alpha: 0.20, depth: 36, dur: 8,  delay: -7, tilt: -9, hideMobile: true },
  { Icon: Helmet,      left: "78%", top: "30%", size: 80,  alpha: 0.22, depth: 20, dur: 9,  delay: -4, tilt: 7,  hideMobile: true },
  { Icon: Drill,       left: "48%", top: "60%", size: 80,  alpha: 0.16, depth: 40, dur: 11, delay: -8, tilt: -12, hideMobile: true },
  { Icon: Gem,         left: "30%", top: "14%", size: 60,  alpha: 0.26, depth: 44, dur: 7,  delay: -1, tilt: 0 },
  { Icon: Gem,         left: "92%", top: "84%", size: 46,  alpha: 0.22, depth: 48, dur: 6,  delay: -3, tilt: 0 },
]

function ToolsDecor() {
  return (
    <div className={styles.decor} aria-hidden="true">
      {TOOLS.map((t, i) => (
        <div
          key={i}
          className={`${styles.tool} ${t.spin ? styles.toolSpin : ""} ${t.hideMobile ? "hidden md:block" : ""}`}
          style={{
            left: t.left,
            top: t.top,
            ["--size" as string]: `${t.size}px`,
            ["--alpha" as string]: t.alpha,
            ["--depth" as string]: t.depth,
            ["--dur" as string]: `${t.dur}s`,
            ["--delay" as string]: `${t.delay}s`,
            ["--tilt" as string]: `${t.tilt}deg`,
          }}
        >
          <t.Icon />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Poussière d'or (canvas)                                             */
/* ------------------------------------------------------------------ */

function GoldDust({ disabled }: { disabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (disabled) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; t: number }
    let particles: P[] = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round((w * h) / 22000)
      particles = Array.from({ length: Math.min(Math.max(count, 30), 80) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vy: -(Math.random() * 0.25 + 0.08),
        vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * Math.PI * 2,
        t: Math.random() * 0.6 + 0.2,
      }))
    }

    // Sprite pré-rendu (halo doux) : évite shadowBlur par particule, très
    // coûteux en CPU/GPU à chaque frame.
    const sprite = document.createElement("canvas")
    sprite.width = 16
    sprite.height = 16
    const sctx = sprite.getContext("2d")
    if (sctx) {
      const g = sctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      g.addColorStop(0, "rgba(246, 217, 138, 1)")
      g.addColorStop(0.35, "rgba(246, 217, 138, 0.8)")
      g.addColorStop(1, "rgba(246, 217, 138, 0)")
      sctx.fillStyle = g
      sctx.fillRect(0, 0, 16, 16)
    }

    let running = true
    let last = 0
    const tick = (now: number) => {
      if (!running) return
      raf = requestAnimationFrame(tick)
      // ~30 fps suffisent pour une dérive lente de poussière.
      if (now - last < 33) return
      last = now
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.y += p.vy
        p.x += p.vx + Math.sin(p.a) * 0.08
        p.a += 0.01
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        const twinkle = (Math.sin(p.a * 3) + 1) / 2
        ctx.globalAlpha = p.t * (0.35 + twinkle * 0.65)
        const size = p.r * 5
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
    }

    // Pause complète quand l'onglet est masqué.
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        raf = requestAnimationFrame(tick)
      }
    }

    resize()
    raf = requestAnimationFrame(tick)
    window.addEventListener("resize", resize)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [disabled])

  if (disabled) return null
  return <canvas ref={ref} className={styles.dust} aria-hidden="true" />
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LinktreePage({
  member,
  team,
  links,
  locale,
}: {
  member: TeamMember
  team: TeamMember[]
  links: SocialLink[]
  locale: AppLocale
}) {
  const copy = COPY[locale] ?? COPY.fr
  const isRtl = locale === "ar"
  const reduced = useReducedMotion() ?? false

  /* ---- spotlight + parallaxe du décor ---- */
  const pageRef = useRef<HTMLDivElement>(null)
  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return
    const page = pageRef.current
    if (!page) return
    const r = page.getBoundingClientRect()
    page.style.setProperty("--mx", `${e.clientX - r.left}px`)
    page.style.setProperty("--my", `${e.clientY - r.top}px`)
    page.style.setProperty("--px", `${((e.clientX - r.left) / r.width - 0.5) * -2}`)
    page.style.setProperty("--py", `${((e.clientY - r.top) / r.height - 0.5) * -2}`)
  }, [reduced])

  /* ---- partage ---- */
  const [copied, setCopied] = useState(false)
  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const title = `${member.firstName} ${member.lastName} · ${COMPANY.name} ${COMPANY.tagline}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* annulé par l'utilisateur */
    }
  }, [member])

  const ease = [0.22, 1, 0.36, 1] as const
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.35 } },
  }
  const item = {
    hidden: { opacity: 0, x: isRtl ? -40 : 40, scale: 0.98 },
    show: { opacity: 1, x: 0, scale: 1, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
  }
  const fade = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease },
  })

  const marqueeText = [...copy.marquee, ...copy.marquee].map((w) => `${w}  ◆  `).join("")

  return (
    <div
      ref={pageRef}
      className={styles.page}
      dir={isRtl ? "rtl" : "ltr"}
      onPointerMove={onMove}
    >
      <div className={styles.bg} aria-hidden="true">
        <Image
          src={COMPANY.background}
          alt=""
          fill
          priority
          sizes="100vw"
          className={styles.bgImg}
        />
        <div className={styles.bgTint} />
        <div className={styles.bgOverlay} />
      </div>
      <div className={styles.spotlight} aria-hidden="true" />
      <ToolsDecor />
      <GoldDust disabled={reduced} />

      <main className={styles.content}>
        <div className={styles.grid}>
          {/* ---------- Identité ---------- */}
          <section className={styles.identity}>
            <motion.div
              className={styles.logoWrap}
              initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 130, damping: 14, delay: 0.1 }}
            >
              <div className={styles.logoGlow} aria-hidden="true" />
              <div className={styles.logoOrbit} aria-hidden="true" />
              <div className={styles.logoRing} aria-hidden="true" />
              <div className={styles.logoDisc}>
                <Image
                  src={COMPANY.logo}
                  alt={`${COMPANY.name} ${COMPANY.tagline}`}
                  width={200}
                  height={200}
                  priority
                />
              </div>
            </motion.div>

            <motion.div className="mt-8" {...fade(0.3)}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-wide text-white/70">
                <span className={styles.pulse} />
                {copy.open} · {COMPANY.hours}
              </span>
            </motion.div>

            <motion.h1 className={`${styles.name} mt-5`} {...fade(0.4)}>
              <span className="text-white/95">{member.firstName} </span>
              <span className={styles.goldText}>{member.lastName}</span>
            </motion.h1>

            <motion.p className={styles.role} {...fade(0.5)}>
              {isRtl && member.roleAr ? member.roleAr : member.role}
            </motion.p>

            <motion.p className="mt-4 max-w-md text-sm leading-relaxed text-white/55" {...fade(0.6)}>
              {COMPANY.name} · {COMPANY.tagline}
              <br />
              {COMPANY.city} · {COMPANY.since} — {copy.footer}
            </motion.p>

            <motion.div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start" {...fade(0.7)}>
              <a href={`tel:${member.phone.replace(/\s+/g, "")}`} className={styles.chip}>
                <Phone className="h-4 w-4 text-[#f6d98a]" />
                {copy.call}
                <span dir="ltr" className="text-white/45">{member.phone}</span>
              </a>
              <a
                href={`https://wa.me/${member.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.chip}
              >
                <MessageCircle className="h-4 w-4 text-[#f6d98a]" />
                {copy.whatsapp}
              </a>
            </motion.div>
          </section>

          {/* ---------- Liens ---------- */}
          <section>
            <motion.nav
              className={styles.links}
              variants={container}
              initial={reduced ? "show" : "hidden"}
              animate="show"
              aria-label="Liens"
            >
              {links.map((link, i) => {
                const Icon = ICONS[link.kind]
                const primary = i === 0
                return (
                  <motion.a
                    key={link.kind}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={item}
                    whileHover={reduced ? undefined : { y: -3 }}
                    whileTap={{ scale: 0.985 }}
                    className={`${styles.link} ${primary ? styles.linkPrimary : ""}`}
                  >
                    <span className={styles.iconBox}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1 text-start">
                      <span className="block text-[17px] font-bold leading-tight">{link.label}</span>
                      <span
                        dir="ltr"
                        className={`block truncate text-[12.5px] ${isRtl ? "text-right" : "text-left"} ${primary ? "text-[#1a1206]/70" : "text-white/50"}`}
                      >
                        {link.hint}
                      </span>
                    </span>
                    <ChevronRight className={`${styles.arrow} h-5 w-5 flex-none ${isRtl ? "rotate-180" : ""}`} />
                  </motion.a>
                )
              })}
            </motion.nav>

            <motion.div
              className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-between"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">{copy.team}</span>
                <ul className="flex items-center gap-2">
                  {team.map((m) => {
                    const active = m.slug === member.slug
                    return (
                      <li key={m.slug}>
                        <Link
                          href={`/links/${m.slug}`}
                          title={`${m.firstName} ${m.lastName} · ${m.role}`}
                          aria-current={active ? "page" : undefined}
                          className={`${styles.avatar} ${active ? styles.avatarActive : ""}`}
                        >
                          {m.initials}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/55 transition hover:text-[#f6d98a]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? copy.copied : copy.share}
              </button>
            </motion.div>
          </section>
        </div>
      </main>

      {/* Bandeau défilant matériaux */}
      <div className={styles.marquee} aria-hidden="true">
        <span className={styles.marqueeTrack}>{marqueeText}</span>
      </div>
    </div>
  )
}
