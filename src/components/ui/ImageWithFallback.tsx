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

  const imageProps = {
    src: error ? '/images/products/placeholder.svg' : src,
    alt,
    fill,
    className,
    sizes,
    priority,
    onError: () => setError(true),
    loading: priority ? 'eager' : 'lazy',
    quality: 75,
    width: fill ? undefined : 640,
    height: fill ? undefined : 640,
  }

  return <Image {...imageProps} />
}