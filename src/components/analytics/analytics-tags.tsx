import Script from "next/script"

/**
 * Analytics, ready but OFF by default: nothing is rendered until the owner
 * sets a real ID in the environment. IDs are validated, never invented.
 *
 *   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX           (Google Tag Manager — preferred)
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX  (GA4 directly, used only without GTM)
 *
 * Both are loaded after the page is interactive, so they never block rendering.
 */
const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/.test(process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "") ? process.env.NEXT_PUBLIC_GTM_ID!.trim() : null
const GA_ID = /^G-[A-Z0-9]{4,16}$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "") ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!.trim() : null

export function AnalyticsTags() {
  if (GTM_ID) {
    return (
      <Script id="gtm-loader" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    )
  }
  if (GA_ID) {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4-config" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
        </Script>
      </>
    )
  }
  return null
}
