import { useState } from 'react'
import Icon from './Icon'
export default function BusinessCard({ business, onOpen }) {
  const [failedImage, setFailedImage] = useState(false)
  const image = business.image
  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_12px_#173f3508] transition-[border-color,box-shadow] hover:border-forest/30 hover:shadow-[0_12px_28px_#173f3514] focus-within:border-forest/50">
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-line bg-[#eaf0e6]">
        {image && !failedImage ? (
          <img
            src={image.path}
            alt={image.alt_text || business.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-forest/65">
            <span className="flex size-16 items-center justify-center rounded-full border border-forest/15 bg-white/50">
              <Icon name="shop" className="size-8" />
            </span>
            <span className="text-xs font-medium">Pa fotografi</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-forest">
          {business.category?.name || 'Pa kategori'}
        </p>
        <h3 className="mt-2 break-words font-display text-2xl leading-tight tracking-tight">
          {business.name}
        </h3>
        {(business.settlement || business.address) && (
          <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-muted">
            <Icon name="pin" className="mt-1 size-4 shrink-0 text-forest" />
            <span className="line-clamp-2">
              {[business.settlement?.name, business.address]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
        )}
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">
          {business.description || 'Përshkrimi nuk është publikuar.'}
        </p>
        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={() => onOpen(business.slug)}
            aria-label={`Shiko biznesin: ${business.name}`}
            className="flex min-h-12 w-full items-center justify-between gap-3 border-t border-line pt-4 text-sm font-semibold text-forest transition-colors hover:text-[#285a49]"
          >
            Shiko biznesin <Icon />
          </button>
        </div>
      </div>
    </article>
  )
}
