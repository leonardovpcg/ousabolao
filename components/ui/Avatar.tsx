import type { CSSProperties } from 'react'

type AvatarProps = {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}

export function Avatar({ name, size = 40, className = '', style }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  // Deterministic warm hue from name — stays in analogous range
  const base = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const hue = (base % 80) + 10 // 10–90° range: warm oranges/yellows/greens

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold select-none flex-shrink-0 font-sans ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: `hsl(${hue}, 55%, 72%)`,
        color: `hsl(${hue}, 55%, 22%)`,
        ...style,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}
