import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res  = await fetch('https://tcgcsv.com/tcgplayer/68/groups')
    const json = await res.json()

    // Return only what the frontend needs: groupId, name, abbreviation
    const groups = json.results.map((g: { groupId: number; name: string; abbreviation: string }) => ({
      groupId:      g.groupId,
      name:         g.name,
      abbreviation: g.abbreviation,
    }))

    return NextResponse.json(groups)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}