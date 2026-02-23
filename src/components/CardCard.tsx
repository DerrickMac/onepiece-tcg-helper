import type { CardResult, PriceResult } from '@/lib/search'

// Rarity badge colours
const RARITY_COLOURS: Record<string, string> = {
  L:   'bg-orange-500 text-white',
  SEC: 'bg-yellow-400 text-black',
  SR:  'bg-purple-500 text-white',
  R:   'bg-blue-500 text-white',
  UC:  'bg-green-600 text-white',
  C:   'bg-zinc-500 text-white',
  PR:  'bg-pink-500 text-white',
}

// One Piece colour → Tailwind dot colour
const COLOR_DOTS: Record<string, string> = {
  Red:    'bg-red-500',
  Blue:   'bg-blue-500',
  Green:  'bg-green-500',
  Purple: 'bg-purple-500',
  Black:  'bg-zinc-800 border border-zinc-500',
  Yellow: 'bg-yellow-400',
}

function PriceRow({ price }: { price: PriceResult }) {
  const fmt = (v: number | null) =>
    v != null ? `$${v.toFixed(2)}` : '—'

  return (
    <div className="flex items-center gap-6 text-sm">
      <span className="w-14 text-zinc-400">{price.sub_type_name}</span>
      <span className="w-20">Market: <span className="text-white font-medium">{fmt(price.market_price)}</span></span>
      <span className="w-16 text-zinc-400">Low: {fmt(price.low_price)}</span>
      <span className="w-16 text-zinc-400">High: {fmt(price.high_price)}</span>
    </div>
  )
}

export default function CardCard({ card }: { card: CardResult }) {
  const rarityClass = RARITY_COLOURS[card.rarity ?? ''] ?? 'bg-zinc-600 text-white'

  return (
    <div className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">

      {/* Card image */}
      {card.image_url && (
        <img
          src={card.image_url}
          alt={card.name}
          className="w-20 h-28 object-cover rounded shrink-0"
        />
      )}

      {/* Card info */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">

        {/* Name + badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{card.name}</span>
          <span className="text-zinc-400 text-sm">{card.card_number}</span>
          {card.rarity && (
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${rarityClass}`}>
              {card.rarity}
            </span>
          )}
          {card.is_alt_art && <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-200">Alt Art</span>}
          {card.is_manga   && <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-200">Manga</span>}
          {card.is_sp      && <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-200">SP</span>}
        </div>

        {/* Colours + type */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <div className="flex gap-1">
            {card.colors.map(c => (
              <span key={c} className={`w-3 h-3 rounded-full inline-block ${COLOR_DOTS[c] ?? 'bg-zinc-600'}`} title={c} />
            ))}
          </div>
          {card.card_type && <span>{card.card_type}</span>}
          {card.cost  != null && <span>Cost {card.cost}</span>}
          {card.power != null && <span>{card.power.toLocaleString()} Power</span>}
          {card.counter_plus != null && <span>+{card.counter_plus} Counter</span>}
        </div>

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Prices */}
        {card.prices.length > 0 ? (
          <div className="flex flex-col gap-1 mt-1">
            {card.prices.map(p => (
              <PriceRow key={p.sub_type_name} price={p} />
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No price data</p>
        )}

        {/* TCGPlayer link */}
        {card.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-xs text-blue-400 hover:text-blue-300 mt-1"
          >
            View on TCGPlayer →
          </a>
        )}

      </div>
    </div>
  )
}