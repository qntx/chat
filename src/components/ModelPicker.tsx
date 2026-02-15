import { useState, useRef, useEffect, useMemo, useCallback, type FC } from 'react'
import { ChevronDownIcon, CheckIcon, SearchIcon } from 'lucide-react'
import { useModel, type ModelInfo } from '@/providers/ModelProvider'
import { useClickOutside } from '@/hooks/use-click-outside'

/** Compact model selector shown in the composer action bar. */
export const ModelPicker: FC = () => {
  const { models, isLoading, selectedModel, setSelectedModel } = useModel()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const close = useCallback(() => setOpen(false), [])
  useClickOutside(containerRef, close, open)

  // Auto-focus search input when popover opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = useMemo(() => {
    if (!query.trim()) return models
    const q = query.toLowerCase()
    return models.filter((m) => m.id.toLowerCase().includes(q))
  }, [models, query])

  const current = models.find((m) => m.id === selectedModel)
  const displayName = current ? stripPrefix(current.id) : isLoading ? 'Loading…' : 'Select model'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            if (!v) setQuery('')
            return !v
          })
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Select model"
      >
        <span className="max-w-[10rem] truncate">{displayName}</span>
        <ChevronDownIcon className={`size-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 flex max-h-96 w-80 flex-col rounded-xl border border-border bg-background shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {isLoading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Loading models…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {query ? 'No matching models' : 'No models available'}
              </div>
            ) : (
              <GroupedModelList
                models={filtered}
                selected={selectedModel}
                onSelect={(id) => {
                  setSelectedModel(id)
                  setOpen(false)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const GroupedModelList: FC<{
  models: ModelInfo[]
  selected: string
  onSelect: (id: string) => void
}> = ({ models, selected, onSelect }) => {
  const groups = new Map<string, ModelInfo[]>()
  for (const m of models) {
    const list = groups.get(m.provider) ?? []
    list.push(m)
    groups.set(m.provider, list)
  }

  return (
    <>
      {[...groups.entries()].map(([provider, items]) => (
        <div key={provider}>
          <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {provider}
          </div>
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${
                m.id === selected ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="flex-1 truncate">{stripPrefix(m.id)}</span>
              {m.type === 'image' && (
                <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                  IMG
                </span>
              )}
              <ModelPrice price={m.price} discountedPrice={m.discountedPrice} />
              {m.id === selected && <CheckIcon className="size-3 shrink-0" />}
            </button>
          ))}
        </div>
      ))}
    </>
  )
}

/** Compact price tag — shows discounted price with strikethrough original */
const ModelPrice: FC<{ price: string | null; discountedPrice: string | null }> = ({
  price,
  discountedPrice,
}) => {
  if (!price) return null

  if (discountedPrice && discountedPrice !== price) {
    return (
      <span className="shrink-0 text-[10px] tabular-nums">
        <span className="text-muted-foreground/40 line-through">${price}</span>{' '}
        <span className="font-medium text-green-600 dark:text-green-400">${discountedPrice}</span>
      </span>
    )
  }

  return (
    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60">${price}</span>
  )
}

/** "qntx/gpt-4o" → "gpt-4o" */
function stripPrefix(id: string): string {
  const i = id.indexOf('/')
  return i >= 0 ? id.slice(i + 1) : id
}
