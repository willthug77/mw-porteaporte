import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy — avoids CORS and hides provider details from client
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 })
  }

  // 1. geocoder.ca — Canadian geocoder backed by Canada Post / government data
  try {
    const res = await fetch(
      `https://geocoder.ca/?latt=${lat}&longt=${lng}&reverse=1&json=1`,
      { headers: { 'User-Agent': 'MW-Multiservices-App/1.0' }, signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const data = await res.json()
      const std = data?.standard
      // stno = house number, stname = street name — both required for a valid result
      if (std?.stno && String(std.stno).trim() !== '0' && std?.stname) {
        const parts = [std.stdirpre, std.stname, std.sttype, std.stdirsfx].filter(Boolean)
        const road = parts.join(' ').trim()
        return NextResponse.json({
          provider: 'geocoder.ca',
          house_number: String(std.stno).trim(),
          road,
          city: std.city || '',
          postcode: std.postal || '',
          raw: std,
        })
      }
    }
  } catch {
    // geocoder.ca unavailable — fall through
  }

  // 2. Nominatim fallback (OSM)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=fr-CA`,
      {
        headers: { 'Accept-Language': 'fr-CA', 'User-Agent': 'MW-Multiservices-App/1.0' },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (res.ok) {
      const data = await res.json()
      const a = data.address || {}
      const house_number = a.house_number || ''
      const road = a.road || a.pedestrian || a.footway || ''
      const city = a.city || a.town || a.village || a.municipality || ''
      const postcode = a.postcode || ''
      return NextResponse.json({ provider: 'nominatim', house_number, road, city, postcode, raw: a })
    }
  } catch {
    // Nominatim unavailable
  }

  return NextResponse.json({ error: 'all_providers_failed' }, { status: 502 })
}
