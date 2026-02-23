import { NextResponse } from 'next/server'
import { searchByCardNumber, searchByName, searchByNameGlobal } from '@/lib/search'
import { syncSet } from '@/lib/sync'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')
  const name = searchParams.get('name')
  const set  = searchParams.get('set')

  try {
    // Mode 1: by card number
    if (q) {
      const results = await searchByCardNumber(q)
      return NextResponse.json(results)
    }

    // Mode 2: by name (with optional set)
    if (name) {
      // No set provided — search across all already-synced sets
      if (!set) {
        const results = await searchByNameGlobal(name)
        return NextResponse.json(results)
      }

      // Set provided — search within that set, auto-sync if not found
      let results: Awaited<ReturnType<typeof searchByName>> = []

      try {
        results = await searchByName(name, set)
      } catch (err) {
        const message = err instanceof Error ? err.message : ''

        if (message.startsWith('Set not found')) {
          // Set not in DB yet — try syncing it from tcgcsv
          try {
            await syncSet(set)
            results = await searchByName(name, set)
          } catch {
            // set abbreviation not valid in tcgcsv either
            return NextResponse.json({ error: `Set not found: ${set}` }, { status: 404 })
          }
        } else {
          throw err
        }
      }

      // Set was found but returned no results — try syncing and retry
      // (handles case where set is in DB but has no products)
      if (results.length === 0) {
        try {
          await syncSet(set)
          results = await searchByName(name, set)
        } catch {
          // sync skipped (TTL) or failed — return empty, don't error
        }
      }

      return NextResponse.json(results)
    }

    return NextResponse.json(
      { error: 'Provide either ?q= or ?name= (with optional &set=)' },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}