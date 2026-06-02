import Image from 'next/image'

interface BrandIconProps {
  size: number
}

export function BrandIcon({ size }: BrandIconProps) {
  return (
    <Image
      src="/newugen-logo-transpparent-white-color.svg"
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="shrink-0 object-contain"
    />
  )
}
