import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const buf = readFileSync(new URL('./logo.png', import.meta.url))
  const b64 = buf.toString('base64')

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`data:image/png;base64,${b64}`}
      width={180}
      height={180}
      alt=""
    />,
    { width: 180, height: 180 },
  )
}
