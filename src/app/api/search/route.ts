import { NextResponse } from 'next/server'
import { searchByCardNumber, searchByName } from '@/lib/search'
import { syncSet } from '@/lib/sync'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q    = searchParams.get('q')
  const name = searchParams.get('name')
  const set  = searchParams.get('set')

  try {
    if (q) {
      const results = await searchByCardNumber(q)
      return NextResponse.json(results)
    }

    if (name && set) {
      let results = await searchByName(name, set)

      // If no results, the set may not be synced yet — try syncing and retry once
      if (results.length === 0) {
        try {
          await syncSet(set)
          results = await searchByName(name, set)
        } catch {
          // syncSet throws if set abbreviation not found in tcgcsv — ignore and return []
        }
      }

      return NextResponse.json(results)
    }

    return NextResponse.json(
      { error: 'Provide either ?q= or both ?name= and ?set=' },
      { status: 400 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}