import { useState } from 'react'
import Icon from './Icon'

export default function BusinessCard({ business, onOpen }) {
  const [failedImage, setFailedImage] = useState(false)
  const image = business.image

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-forest/5">
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-line bg-[#eaf0e6]">
        {image && !failedImage ? <img src={image.path} alt={image.alt_text || business.name} loading="lazy"
          className="h-full w-full object-cover" onError={() => setFailedImage(true)} /> : (
          <div className="flex flex-col items-center gap-3 text-forest/65"><Icon name="shop" className="size-12" /><span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Bizneset e Lipjanit</span></div>
        )}
        {business.is_demo && <span className="absolute top-3 left-3 rounded-full border border-white/70 bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">Demo</span>}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-forest">{business.category?.name || 'Pa kategori'}</p>
        <h3 className="mt-2 break-words text-xl font-semibold tracking-tight">{business.name}</h3>
        {business.settlement && <p className="mt-3 flex items-start gap-2 text-sm text-muted"><Icon name="pin" className="mt-0.5 size-4 shrink-0" />{business.settlement.name}</p>}
        {business.address && <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted">{business.address}</p>}
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{business.description || 'Përshkrimi nuk është publikuar.'}</p>
        <div className="mt-auto pt-6">
          <button type="button" onClick={() => onOpen(business.slug)} aria-label={`Shiko biznesin: ${business.name}`}
            className="flex min-h-11 w-full items-center justify-between gap-3 border-t border-line pt-4 text-sm font-semibold text-forest">
            Shiko biznesin <Icon />
          </button>
        </div>
      </div>
    </article>
  )
}
