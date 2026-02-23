'use client'

import { useState } from 'react'
import CardCard from '@/components/CardCard'
import type { CardResult } from '@/lib/search'

type AppTab = 'search' | 'sync'
type SearchMode = 'name' | 'number'

export default function Home() {
  // Top-level tab
  const [tab, setTab] = useState<AppTab>('search')

  // Search state
  const [mode, setMode] = useState<SearchMode>('name')
  const [query, setQuery] = useState('')
  const [set, setSet] = useState('')
  const [results, setResults] = useState<CardResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])

    const url =
      mode === 'number'
        ? `/api/search?q=${encodeURIComponent(query)}`
        : set
          ? `/api/search?name=${encodeURIComponent(query)}&set=${encodeURIComponent(set)}`
          : `/api/search?name=${encodeURIComponent(query)}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        setResults(data)
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSyncAll() {
    setSyncing(true)
    setSyncProgress('Fetching set list…')

    try {
      const res = await fetch('/api/groups')
      const groups: { groupId: number; name: string; abbreviation: string }[] =
        await res.json()

      for (let i = 0; i < groups.length; i++) {
        const g = groups[i]
        setSyncProgress(
          `Syncing ${g.abbreviation} — ${g.name} (${i + 1}/${groups.length})`
        )
        await fetch(`/api/sync?set=${encodeURIComponent(g.abbreviation)}`, {
          method: 'POST',
        })
      }

      setSyncProgress(`Done! All ${groups.length} sets synced.`)
    } catch {
      setSyncProgress('Sync failed — check console')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          One Piece TCG Price Checker
        </h1>

        {/* Top-level tabs: Search | Sync */}
        <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-0">
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === 'search'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab('sync')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === 'sync'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sync
          </button>
        </div>

        {/* ── Search tab ── */}
        {tab === 'search' && (
          <>
            {/* Search mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('name')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  mode === 'name'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                By Name
              </button>
              <button
                type="button"
                onClick={() => setMode('number')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  mode === 'number'
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                By Card Number
              </button>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-8">
              {mode === 'number' ? (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. EB03-001"
                  className="bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  required
                />
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Card name, e.g. Vivi"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                    required
                  />
                  <input
                    type="text"
                    value={set}
                    onChange={(e) => setSet(e.target.value)}
                    placeholder="Set (optional)"
                    className="w-36 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="self-start px-6 py-2 bg-white text-black font-medium rounded hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? 'Searching…' : 'Search'}
              </button>
            </form>

            {/* Error */}
            {error && <p className="text-red-400 mb-6">{error}</p>}

            {/* Results */}
            {results.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-zinc-400 text-sm">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
                {results.map((card) => (
                  <CardCard key={card.product_id} card={card} />
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && !error && results.length === 0 && query && (
              <p className="text-zinc-500">No results found.</p>
            )}
          </>
        )}

        {/* ── Sync tab ── */}
        {tab === 'sync' && (
          <div className="flex flex-col gap-4">
            <p className="text-zinc-400 text-sm">
              Syncs all One Piece sets from TCGPlayer into the database. First
              run takes ~5–6 minutes. Subsequent runs skip sets synced within 24
              hours.
            </p>

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncing}
              className="self-start px-6 py-2 bg-white text-black font-medium rounded hover:bg-zinc-200 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync All Sets'}
            </button>

            {syncProgress && (
              <p className="text-zinc-300 text-sm font-mono">{syncProgress}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
