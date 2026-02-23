import { supabase } from './supabase'

const TCGCSV_BASE = 'https://tcgcsv.com/tcgplayer/68'
const TTL_MS = 24 * 60 * 60 * 1000

const GAMEPLAY_TAGS = new Set([
  "Rush", "Blocker", "Double Attack", "Counter", "Trigger",
  "Activate: Main", "Once Per Turn", "On Play", "On K.O.",
  "When Attacking", "Opponent's Turn", "Your Turn",
  "End of Your Turn", "Main", "On Block"
])

const DON_TAG_RE = /^DON!! x\d+$/

interface ExtendedDataItem {
    name: string
    displayName: string
    value: string
}

interface TcgProduct {
    productId: number
    name: string
    cleanName: string
    imageUrl: string
    url: string
    extendedData: ExtendedDataItem[]
}

interface TcgPrice {
    productId: number
    subTypeName: string
    lowPrice: number | null
    midPrice: number | null
    highPrice: number | null
    marketPrice: number | null
}

interface TcgGroup {
    groupId: number
    name: string
    abbreviation: string
}

function parseExtendedData(extendedData: ExtendedDataItem[]): Record<string, string> {
    const map: Record<string, string> = {}
    for (const item of extendedData) {
        map[item.name] = item.value
    }
    return map
}

function extractTags(description: string): string[] {
    const found: string[] = []
    const matches = description.matchAll(/\[([^\]]+)\]/g)
    for (const match of matches) {
        const tag = match[1]
        if (GAMEPLAY_TAGS.has(tag) || DON_TAG_RE.test(tag)) {
            found.push(tag)
        }
    }
    return [...new Set(found)]
}

function splitList(value: string | undefined): string[] {
    if (!value) return []
    return value.split(';').map(s => s.trim()).filter(Boolean)
}

function safeInt(value: string | undefined): number | null {
    if (!value) return null
    const n = parseInt(value, 10)
    return isNaN(n) ? null : n
}

export async function syncSet(abbreviation: string): Promise<{
    skipped: boolean
    group?: string
    productsUpserted?: number
    pricesInserted?: number
}> {
    // Fetch all groups and find the one matching the abbreviation
    const groupRes = await fetch(`${TCGCSV_BASE}/groups`)
    const groupsJson = await groupRes.json()
    const groups: TcgGroup[] = groupsJson.results

    const group = groups.find(
        g => g.abbreviation.toLowerCase() === abbreviation.toLowerCase()
    )
    if (!group) throw new Error(`Set not found: ${abbreviation}`)

    // TTL check - skip if synced less than 24 hour ago
    const { data: existing } = await supabase
        .from('groups')
        .select('synced_at')
        .eq('group_id', group.groupId)
        .single()
    
    if (existing?.synced_at) {
        const age = Date.now() - new Date(existing.synced_at).getTime()
        if (age < TTL_MS) return { skipped: true }
    }

    // Fetch products from tcgcsv
    const productRes = await fetch(`${TCGCSV_BASE}/${group.groupId}/products`)
    const productJson = await productRes.json()
    const products: TcgProduct[] = productJson.results

    // Parse each product into a DB row
    const productRows = products.map(p => {
        const ext = parseExtendedData(p.extendedData)
        return {
            product_id:     p.productId,
            group_id:       group.groupId,
            name:           p.name,
            clean_name:     p.cleanName,
            image_url:      p.imageUrl,
            url:            p.url,
            card_number:    ext['Number'] ?? null,
            card_type:      ext['CardType'] ?? null,
            colors:         splitList(ext['Color']),
            rarity:         ext['Rarity'] ?? null,
            cost:           safeInt(ext['Cost']),
            power:          safeInt(ext['Power']),
            life:           safeInt(ext['Life']),
            attribute:      ext['Attribute'] ?? null,
            subtypes:       splitList(ext['Subtypes']),
            counter_plus:   safeInt(ext['Counterplus']),
            description:     ext['Description'] ?? null,
            tags:           extractTags(ext['Description'] ?? ''),
            is_alt_art:     p.name.includes('(Alternate Art)'),
            is_manga:       p.name.includes('(Manga)'),
            is_sp:          p.name.includes('(SP)'),
            synced_at:      new Date().toISOString(),
        }
    })

    const { error: groupError } = await supabase.from('groups').upsert({
        group_id:     group.groupId,
        name:         group.name,
        abbreviation: group.abbreviation,
        synced_at:    new Date().toISOString(),
        }, { onConflict: 'group_id' })
    if (groupError) throw new Error(`Groups upsert failed: ${groupError.message}`)

    const { error: productError } = await supabase
        .from('products')
        .upsert(productRows, { onConflict: 'product_id' })
    if (productError) throw new Error(`Products upsert failed: ${productError.message}`)

    // Fetch prices from tcgcsv
    const pricesRes = await fetch(`${TCGCSV_BASE}/${group.groupId}/prices`)
    const pricesJson = await pricesRes.json()
    const prices: TcgPrice[] = pricesJson.results

    // Map prices to DB rows (append-only — always insert, never update)
    const priceRows = prices.map(p => ({
        product_id:    p.productId,
        sub_type_name: p.subTypeName,
        low_price:     p.lowPrice,
        mid_price:     p.midPrice,
        high_price:    p.highPrice,
        market_price:  p.marketPrice,
        recorded_at:   new Date().toISOString(),
    }))

    const { error: priceError } = await supabase.from('prices').insert(priceRows)
    if (priceError) throw new Error(`Prices insert failed: ${priceError.message}`)

    // Return summary
    return {
        skipped:          false,
        group:            group.name,
        productsUpserted: productRows.length,
        pricesInserted:   priceRows.length,
    }

}

