'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

export function ImageWithFallback({
  src,
  alt,
  fill = false,
  className = '',
  sizes,
  priority = false,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  return (
    <Image
      src={error ? '/images/products/placeholder.svg' : src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  )
}