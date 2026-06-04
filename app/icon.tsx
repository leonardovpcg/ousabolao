import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  // Read logo co-located in app/ — works in dev and Vercel prod
  const buf = readFileSync(new URL('./logo.png', import.meta.url))
  const b64 = buf.toString('base64')

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`data:image/png;base64,${b64}`}
      width={512}
      height={512}
      alt=""
    />,
    { width: 512, height: 512 },
  )
}
