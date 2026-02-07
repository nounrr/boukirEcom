import React from "react"

export type PdfPaperSize = "a4" | "a5"
export type PdfImageFormat = "png" | "jpeg"

export async function downloadPdfFromReactElement(options: {
  element: React.ReactElement
  fileName: string
  paper?: PdfPaperSize
  widthPx?: number
  heightPx?: number
  /**
   * Render scale used by html2canvas. Higher = sharper but slower/larger.
   * Defaults to 2.5 for print-quality A4 captures.
   */
  scale?: number
  /**
   * Image format embedded into the PDF. PNG is lossless (best quality).
   */
  imageFormat?: PdfImageFormat
  /**
   * Only used when `imageFormat` is `jpeg`.
   */
  jpegQuality?: number
}): Promise<void> {
  const paper = options.paper ?? "a4"
  const widthPx = options.widthPx ?? (paper === "a4" ? 794 : 559)
  const heightPx = options.heightPx ?? (paper === "a4" ? 1123 : 794)
  const scale = options.scale ?? 2.5
  const imageFormat: PdfImageFormat = options.imageFormat ?? "png"
  const jpegQuality = typeof options.jpegQuality === "number" ? options.jpegQuality : 0.92

  const [{ createRoot }, jspdfModule, html2canvasModule] = await Promise.all([
    import("react-dom/client"),
    import("jspdf"),
    import("html2canvas"),
  ])

  const JsPDF = (jspdfModule as any).jsPDF ?? (jspdfModule as any).default
  const html2canvas = (html2canvasModule as any).default ?? (html2canvasModule as any)

  if (!JsPDF || !html2canvas) {
    throw new Error("PDF dependencies failed to load")
  }

  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = `${widthPx}px`
  container.style.height = `${heightPx}px`
  container.style.background = "#ffffff"
  container.style.color = "#000000"
  container.style.overflow = "hidden"
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(options.element)

  const cleanup = () => {
    try {
      root.unmount()
    } catch {
      // ignore
    }
    if (container.parentNode) container.parentNode.removeChild(container)
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, 350))

    // Wait for fonts when available (helps avoid layout shifts in capture)
    const fonts = (document as any).fonts
    if (fonts?.ready) {
      try {
        await fonts.ready
      } catch {
        // ignore
      }
    }

    // Wait for images inside container
    const imgs = Array.from(container.querySelectorAll("img")) as HTMLImageElement[]
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
      )
    )

    // Hide elements marked as print-hidden
    const hiddenEls = Array.from(container.querySelectorAll(".print-hidden")) as HTMLElement[]
    const previousDisplay = hiddenEls.map((el) => el.style.display)
    hiddenEls.forEach((el) => {
      el.style.display = "none"
    })

    const canvas = await html2canvas(container, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc: Document) => {
        // html2canvas does not support parsing `oklch()` color values.
        // Tailwind v4 often outputs OKLCH for tokens like bg-background/text-foreground.
        // Force safe hex/rgb values for the common theme CSS variables so PDF generation is stable
        // without overriding the invoice template's own colors.
        const style = clonedDoc.createElement("style")
        style.setAttribute("data-invoice-pdf-safe-colors", "true")
        style.textContent = `
          :root{color-scheme: light !important;}
          :root{
            --background:#ffffff !important;
            --foreground:#0b0f19 !important;
            --card:#ffffff !important;
            --card-foreground:#0b0f19 !important;
            --popover:#ffffff !important;
            --popover-foreground:#0b0f19 !important;
            --primary:#f59e0b !important;
            --primary-foreground:#111827 !important;
            --secondary:#f3f4f6 !important;
            --secondary-foreground:#111827 !important;
            --muted:#f3f4f6 !important;
            --muted-foreground:#6b7280 !important;
            --accent:#f3f4f6 !important;
            --accent-foreground:#111827 !important;
            --destructive:#dc2626 !important;
            --border:#e5e7eb !important;
            --input:#e5e7eb !important;
            --ring:#f59e0b !important;
          }
          html,body{background:#ffffff !important;color:#0b0f19 !important;}
        `
        clonedDoc.head.appendChild(style)
      },
    })

    hiddenEls.forEach((el, idx) => {
      el.style.display = previousDisplay[idx] || ""
    })

    const pdf = new JsPDF({
      orientation: "portrait",
      unit: "pt",
      format: paper,
      compress: true,
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height)
    const imgWidth = canvas.width * ratio
    const imgHeight = canvas.height * ratio
    const x = (pdfWidth - imgWidth) / 2
    const y = (pdfHeight - imgHeight) / 2

    if (imageFormat === "png") {
      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight, undefined, "FAST")
    } else {
      const imgData = canvas.toDataURL("image/jpeg", jpegQuality)
      pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight, undefined, "MEDIUM")
    }

    pdf.save(options.fileName)
  } finally {
    cleanup()
  }
}
