/**
 * Official brand logos uploaded through the back-office on the production
 * site (GET /api/brands → image_url), bundled under /public/brands so the
 * brands carousel shows real logos even when an environment's API returns a
 * brand without an image (e.g. an older local database copy).
 *
 * The API image always wins; this map is only a fallback keyed by brand id.
 * To refresh: re-download from the production API's image_url values.
 */
export const BRAND_LOGOS: Record<number, { name: string; src: string }> = {
  1: { name: "Kerakoll", src: "/brands/1-kerakoll.png" },
  2: { name: "Sika", src: "/brands/2-sika.jpg" },
  3: { name: "Groupo puma", src: "/brands/3-groupo-puma.png" },
  4: { name: "Mortecol", src: "/brands/4-mortecol.jpg" },
  5: { name: "Generall", src: "/brands/5-generall.jpg" },
  6: { name: "Bosch", src: "/brands/6-bosch.png" },
  7: { name: "Xcort", src: "/brands/7-xcort.jpg" },
  8: { name: "INGCO", src: "/brands/8-ingco.jpg" },
  9: { name: "Total", src: "/brands/9-total.png" },
  10: { name: "DIMA TUBE", src: "/brands/10-dima-tube.png" },
  11: { name: "ASTRAL", src: "/brands/11-astral.jpg" },
  12: { name: "LAP", src: "/brands/12-lap.jpg" },
  15: { name: "DEN BRAVEN", src: "/brands/15-den-braven.png" },
  16: { name: "HANDIRON", src: "/brands/16-handiron.jpg" },
  21: { name: "JADEVER", src: "/brands/21-jadever.png" },
  22: { name: "BELLOTA", src: "/brands/22-bellota.png" },
  23: { name: "Atlas", src: "/brands/23-atlas.png" },
  25: { name: "CAT", src: "/brands/25-cat.png" },
  27: { name: "INGELEC", src: "/brands/27-ingelec.png" },
  28: { name: "ABLAGO", src: "/brands/28-ablago.jpg" },
  30: { name: "ONE BOND", src: "/brands/30-one-bond.png" },
  31: { name: "MPC", src: "/brands/31-mpc.webp" },
  32: { name: "WDLINK", src: "/brands/32-wdlink.png" },
  33: { name: "DAKOTA", src: "/brands/33-dakota.webp" },
  35: { name: "VIDAL", src: "/brands/35-vidal.png" },
  36: { name: "RUBI", src: "/brands/36-rubi.png" },
  37: { name: "DANOSA", src: "/brands/37-danosa.png" },
  38: { name: "AKRO", src: "/brands/38-akro.png" },
  40: { name: "INDEX", src: "/brands/40-index.png" },
  41: { name: "ABC POWER", src: "/brands/41-abc-power.jpg" },
  42: { name: "GABKA", src: "/brands/42-gabka.jpg" },
  43: { name: "DINGQI", src: "/brands/43-dingqi.png" },
  44: { name: "Armano", src: "/brands/44-armano.webp" },
  61: { name: "SOPREMA", src: "/brands/61-soprema.webp" },
}
