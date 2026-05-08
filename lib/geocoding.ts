export interface AddressResult {
  formatted: string
  street: string
  city: string
  postcode: string
  raw: Record<string, string>
}

const cache = new Map<string, AddressResult | null>()

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`
}

export async function reverseGeocode(lat: number, lng: number): Promise<AddressResult | null> {
  const key = cacheKey(lat, lng)
  if (cache.has(key)) return cache.get(key)!

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'fr-CA',
          'User-Agent': 'MW-Multiservices-App/1.0',
        },
      }
    )
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()
    const a = data.address || {}

    const houseNumber = a.house_number || ''
    const road = a.road || a.pedestrian || a.footway || ''
    const street = [houseNumber, road].filter(Boolean).join(' ')
    const city = a.city || a.town || a.village || a.municipality || ''
    const postcode = a.postcode || ''
    const formatted = [street, city, postcode].filter(Boolean).join(', ')

    const result: AddressResult = { formatted, street, city, postcode, raw: a }
    cache.set(key, result)
    return result
  } catch {
    cache.set(key, null)
    return null
  }
}
