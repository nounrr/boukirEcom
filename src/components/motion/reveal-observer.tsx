"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    __bdReveal?: boolean
  }
}

/** Elements that never get an automatic reveal. */
const EXCLUDE = [
  "[data-reveal]",
  "[data-no-reveal]",
  "header",
  "nav",
  "form",
  "dialog",
  "[role=dialog]",
  "[role=menu]",
  "[role=listbox]",
  "[aria-roledescription=carousel]",
  "[data-smart-fab]",
  "table",
  "[data-radix-popper-content-wrapper]",
  "[data-sonner-toaster]",
].join(",")

const AUTO_SELECTOR = "main h2, main h3, main p, main li, main [data-auto-reveal]"

/**
 * One IntersectionObserver for the whole site. Any element carrying
 * `data-reveal` (or `data-draw`) receives `.is-visible` when it enters the
 * viewport; CSS in globals.css performs the transition. Server components can
 * therefore animate with zero client JS of their own.
 *
 * In addition, headings, paragraphs and list/grid items inside <main> that
 * start *below the fold* are tagged automatically (with a small sibling
 * stagger), so every page's sections reveal on scroll. Elements already on
 * screen are never hidden, which avoids any flicker.
 *
 * Content is only hidden when <html> has `.motion-ready`; if this component
 * never runs, the head script removes the class and everything stays visible.
 */
export function RevealObserver() {
  useEffect(() => {
    window.__bdReveal = true
    if (!("IntersectionObserver" in window)) {
      document.documentElement.classList.remove("motion-ready")
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-visible")
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    )
    const selector = "[data-reveal]:not(.is-visible),[data-draw]:not(.is-visible)"
    const scan = (root: ParentNode) => root.querySelectorAll(selector).forEach((el) => io.observe(el))

    const autoTag = () => {
      const fold = window.innerHeight * 0.92
      const nodes = document.querySelectorAll<HTMLElement>(AUTO_SELECTOR)
      for (const el of nodes) {
        if (el.dataset.autoChecked) continue
        el.dataset.autoChecked = "1"
        if (el.closest(EXCLUDE)) continue
        const rect = el.getBoundingClientRect()
        if (rect.height === 0 || rect.top < fold) continue
        // List items only when they behave like cards in a list/grid.
        if (el.tagName === "LI" && (el.parentElement?.children.length ?? 0) < 2) continue
        const siblings = el.parentElement ? Array.from(el.parentElement.children) : []
        const index = Math.max(0, siblings.indexOf(el))
        el.setAttribute("data-reveal", el.tagName === "LI" ? "" : "fade")
        el.style.setProperty("--reveal-delay", `${Math.min(index % 6, 5) * 70}ms`)
        io.observe(el)
      }
    }

    scan(document)
    // let the first paint settle before measuring
    const first = window.setTimeout(autoTag, 120)
    let pending = 0
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement) && !(node instanceof SVGElement)) return
          if ((node as Element).matches?.(selector)) io.observe(node as Element)
          scan(node as ParentNode)
        })
      }
      window.clearTimeout(pending)
      pending = window.setTimeout(autoTag, 220)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(pending)
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
