/**
 * Fetches a remote image URL and converts it to a base64 data URL.
 * Required before html-to-image canvas capture — if the image is a cross-origin
 * HTTPS URL (e.g. Supabase Storage), mobile Safari taints the canvas and returns
 * a blank/black image. Fetching first and embedding as data URL avoids this.
 */
export async function urlToDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror   = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}
