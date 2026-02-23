import { NextResponse } from 'next/server'
import { syncSet } from '@/lib/sync'

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const set = searchParams.get('set')

    // 400 if no set param provided
    if (!set) {
        return NextResponse.json({ error: 'Missing ?set= param'}, {status: 400})
    }

    try {
        const result = await syncSet(set)
        return NextResponse.json(result)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        
         // 404 if the set abbrevation wasn't found in tcgcsv
         if (message.startsWith('Set not found')) {
            return NextResponse.json({ error: message }, { status: 404 })
         }

         // 500 for everything else
            return NextResponse.json({ error: message }, { status: 500 })
    }

   
}