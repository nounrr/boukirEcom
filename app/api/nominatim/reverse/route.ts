import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = Number(searchParams.get("lat"))
    const lng = Number(searchParams.get("lng"))

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 })
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("format", "json")
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lon", String(lng))
    url.searchParams.set("addressdetails", "1")

    const email = process.env.NOMINATIM_EMAIL
    if (email) url.searchParams.set("email", email)

    const upstream = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        // Nominatim requires an identifying User-Agent.
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
    console.error("Nominatim reverse proxy error:", error)
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 502 })
  }
}
