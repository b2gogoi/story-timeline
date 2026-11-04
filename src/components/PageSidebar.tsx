export type AppPage = 'player' | 'gallery'

export function PageSidebar({ activePage, onNavigate }: { activePage: AppPage; onNavigate: (page: AppPage) => void }) {
  const options: Array<{ id: AppPage; label: string; glyph: string }> = [
    { id: 'player', label: 'Player', glyph: '▶' },
    { id: 'gallery', label: 'Gallery', glyph: '▦' },
  ]

  return (
    <aside className="flex w-[76px] shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-neutral-950 py-5">
      <div className="mb-4 grid size-10 place-items-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-sm font-bold tracking-tight text-cyan-200" aria-label="Story Timeline">
        ST
      </div>
      <nav aria-label="Main navigation" className="flex w-full flex-col items-center gap-2">
        {options.map(option => {
          const selected = activePage === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate(option.id)}
              className={`flex w-[64px] flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] transition-colors focus-visible:outline focus-visible:outline-cyan-400 ${selected ? 'bg-cyan-300/10 text-cyan-200' : 'text-white/50 hover:bg-white/5 hover:text-white/85'}`}
            >
              <span aria-hidden="true" className="text-lg leading-none">{option.glyph}</span>
              {option.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
