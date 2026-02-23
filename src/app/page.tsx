'use client'

import { useState } from 'react'
import CardCard from '@/components/CardCard'
import type { CardResult } from '@/lib/search'

type SearchMode = 'number' | 'name'

export default function Home() {
  const [mode, setMode]       = useState<SearchMode>('number')
  const [query, setQuery]     = useState('')
  const [set, setSet]         = useState('')
  const [results, setResults] = useState<CardResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults([])

    const url = mode === 'number'
      ? `/api/search?q=${encodeURIComponent(query)}`
      : `/api/search?name=${encodeURIComponent(query)}&set=${encodeURIComponent(set)}`

    try {
      const res  = await fetch(url)
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">One Piece TCG Price Checker</h1>

        {/* Search mode toggle */}
        <div className="flex gap-2 mb-4">
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
          <button
            type="button"
            onClick={() => setMode('name')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              mode === 'name'
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            By Name + Set
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-8">
          {mode === 'number' ? (
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. EB03-001"
              className="bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              required
            />
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Card name, e.g. Vivi"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                required
              />
              <input
                type="text"
                value={set}
                onChange={e => setSet(e.target.value)}
                placeholder="Set, e.g. EB-03"
                className="w-36 bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
                required
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
        {error && (
          <p className="text-red-400 mb-6">{error}</p>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="flex flex-col gap-4">
            <p className="text-zinc-400 text-sm">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.map(card => (
              <CardCard key={card.product_id} card={card} />
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && !error && results.length === 0 && query && (
          <p className="text-zinc-500">No results found.</p>
        )}

      </div>
    </main>
  )
}