import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get("q") || "").trim()

    if (q.length < 2) {
      return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 })
    }

    const countrycodes = (searchParams.get("countrycodes") || "ma").trim()
    const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit") || 5)))

    const centerLat = Number(searchParams.get("lat"))
    const centerLng = Number(searchParams.get("lng"))

    const url = new URL("https://nominatim.openstreetmap.org/search")
    url.searchParams.set("format", "json")
    url.searchParams.set("q", q)
    url.searchParams.set("addressdetails", "1")
    url.searchParams.set("limit", String(limit))
    url.searchParams.set("countrycodes", countrycodes)

    if (Number.isFinite(centerLat) && Number.isFinite(centerLng)) {
      const viewbox = `${centerLng - 0.5},${centerLat - 0.5},${centerLng + 0.5},${centerLat + 0.5}`
      url.searchParams.set("viewbox", viewbox)
      url.searchParams.set("bounded", "0")
    }

    const email = process.env.NOMINATIM_EMAIL
    if (email) url.searchParams.set("email", email)

    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "boukir-ecom (Next.js)",
      },
    })

    if (upstream.status === 429) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 })
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "UPSTREAM_ERROR", status: upstream.status },
        { status: 502 }
      )
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Nominatim search proxy error:", error)
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 502 })
  }
}
