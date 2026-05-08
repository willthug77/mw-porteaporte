export interface AddressResult {
  formatted: string
  street: string
  city: string
  postcode: string
  approximate: boolean // true when no house_number found in any provider
  raw: Record<string, string>
}

const cache = new Map<string, AddressResult | null>()

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`  // ~0.1m precision — prevents cross-building cache hits
}

export async function reverseGeocode(lat: number, lng: number): Promise<AddressResult | null> {
  const key = cacheKey(lat, lng)
  if (cache.has(key)) return cache.get(key)!

  try {
    // zoom=18 forces Nominatim to resolve at house-number level (maximum precision)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=fr-CA`,
      {
        headers: {
          'Accept-Language': 'fr-CA',
          'User-Agent': 'MW-Multiservices-App/1.0',
        },
      }
    )
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()
    console.log('[Nominatim] response:', data)
    const a = data.address || {}

    let houseNumber = a.house_number || ''
    const road = a.road || a.pedestrian || a.footway || ''

    // Fallback to Photon (Komoot) if Nominatim has no house number
    if (!houseNumber) {
      try {
        const photonRes = await fetch(
          `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&limit=1&lang=fr`,
          { headers: { 'User-Agent': 'MW-Multiservices-App/1.0' } }
        )
        if (photonRes.ok) {
          const photonData = await photonRes.json()
          const props = photonData?.features?.[0]?.properties
          if (props?.housenumber) {
            houseNumber = props.housenumber
          }
        }
      } catch {
        // Photon failed — keep Nominatim result as-is
      }
    }

    const street = [houseNumber, road].filter(Boolean).join(' ')
    const city = a.city || a.town || a.village || a.municipality || ''
    const postcode = a.postcode || ''
    const formatted = [street, city, postcode].filter(Boolean).join(', ')
    const approximate = !houseNumber

    const result: AddressResult = { formatted, street, city, postcode, approximate, raw: a }
    cache.set(key, result)
    return result
  } catch {
    cache.set(key, null)
    return null
  }
}
