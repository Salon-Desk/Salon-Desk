'use client'

import { X } from 'lucide-react'
import Image from 'next/image'
import { memo, useState } from 'react'

import { shouldUnoptimizedImage } from '@/lib/util/remoteImage'

import {
  previewGridClassName,
  previewTileClassName,
  previewTileRemoveButtonClassName,
} from './constants'
import type { PreviewItem } from './types'

interface PreviewTileProps {
  item: PreviewItem
  index: number
  onRemove: (index: number) => void
}

/** Memoized (by src, since `item` is rebuilt every render) so adding one photo does not
 * re-render every tile already on screen. */
export const PreviewTile = memo(
  function PreviewTile({ item, index, onRemove }: PreviewTileProps) {
    const [src, setSrc] = useState(item.src)

    return (
      <div className={previewTileClassName}>
        <Image
          src={src}
          alt="preview"
          fill
          sizes="192px"
          className="object-cover"
          unoptimized={shouldUnoptimizedImage(src)}
          onError={() => {
            if (item.fallbackSrc && src !== item.fallbackSrc) {
              setSrc(item.fallbackSrc)
            }
          }}
        />

        <button
          type="button"
          onClick={() => onRemove(index)}
          className={previewTileRemoveButtonClassName}
        >
          <X size={16} />
        </button>
      </div>
    )
  },
  (prev, next) =>
    prev.index === next.index &&
    prev.onRemove === next.onRemove &&
    prev.item.src === next.item.src &&
    prev.item.fallbackSrc === next.item.fallbackSrc,
)

interface PreviewGridProps {
  items: PreviewItem[]
  onRemove: (index: number) => void
}

export function PreviewGrid({ items, onRemove }: PreviewGridProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className={previewGridClassName}>
      {items.map((item, i) => (
        <PreviewTile key={`${item.src}-${i}`} item={item} index={i} onRemove={onRemove} />
      ))}
    </div>
  )
}
