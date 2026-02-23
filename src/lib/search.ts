import { supabase } from './supabase'

export interface PriceResult {
  sub_type_name: string
  market_price: number | null
  low_price: number | null
  mid_price: number | null
  high_price: number | null
  recorded_at: string
}

export interface CardResult {
  product_id: number
  name: string
  card_number: string | null
  card_type: string | null
  colors: string[]
  rarity: string | null
  cost: number | null
  power: number | null
  counter_plus: number | null
  tags: string[]
  is_alt_art: boolean
  is_manga: boolean
  is_sp: boolean
  url: string | null
  image_url: string | null
  prices: PriceResult[]
}

// ---------------------------------------------------------------------------
// Helper: fetch latest prices for a list of product IDs
// ---------------------------------------------------------------------------

async function getLatestPrices(productIds: number[]): Promise<Map<number, PriceResult[]>> {
  if (productIds.length === 0) return new Map()

  // Fetch all price rows for these products in one query
  const { data, error } = await supabase
    .from('prices')
    .select('product_id, sub_type_name, market_price, low_price, mid_price, high_price, recorded_at')
    .in('product_id', productIds)
    .order('recorded_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!data) return new Map()

  // Group by product_id, then keep only the latest row per sub_type_name
  const map = new Map<number, PriceResult[]>()

  for (const row of data) {
    const existing = map.get(row.product_id) ?? []

    // Only add this sub_type if we haven't seen it yet for this product
    // (rows are already ordered by recorded_at DESC, so first seen = most recent)
    const alreadyHaveSubType = existing.some(p => p.sub_type_name === row.sub_type_name)
    if (!alreadyHaveSubType) {
      existing.push({
        sub_type_name: row.sub_type_name,
        market_price: row.market_price,
        low_price: row.low_price,
        mid_price: row.mid_price,
        high_price: row.high_price,
        recorded_at: row.recorded_at,
      })
      map.set(row.product_id, existing)
    }
  }

  return map
}

// ---------------------------------------------------------------------------
// Helper: attach prices to a list of product rows
// ---------------------------------------------------------------------------

async function attachPrices(products: CardResult[]): Promise<CardResult[]> {
  const ids = products.map(p => p.product_id)
  const priceMap = await getLatestPrices(ids)
  return products.map(p => ({
    ...p,
    prices: priceMap.get(p.product_id) ?? [],
  }))
}

// ---------------------------------------------------------------------------
// Search by card number (e.g. "EB03-001")
// ---------------------------------------------------------------------------

export async function searchByCardNumber(cardNumber: string): Promise<CardResult[]> {
  const { data, error } = await supabase
    .from('products')
    .select('product_id, name, card_number, card_type, colors, rarity, cost, power, counter_plus, tags, is_alt_art, is_manga, is_sp, url, image_url')
    .ilike('card_number', cardNumber)

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  return attachPrices(data as CardResult[])
}

// ---------------------------------------------------------------------------
// Search by name + set abbreviation (e.g. name="Vivi", set="EB-03")
// ---------------------------------------------------------------------------

export async function searchByName(name: string, set: string): Promise<CardResult[]> {
  // Find the group_id for this set abbreviation
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('group_id')
    .ilike('abbreviation', set)
    .single()

  if (groupError || !groupData) throw new Error(`Set not found: ${set}`)

  const { data, error } = await supabase
    .from('products')
    .select('product_id, name, card_number, card_type, colors, rarity, cost, power, counter_plus, tags, is_alt_art, is_manga, is_sp, url, image_url')
    .eq('group_id', groupData.group_id)
    .ilike('name', `%${name}%`)

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  return attachPrices(data as CardResult[])
}

// Search by name across ALL synced sets (no set required)
export async function searchByNameGlobal(name: string): Promise<CardResult[]> {
  const { data, error } = await supabase
    .from('products')
    .select('product_id, name, card_number, card_type, colors, rarity, cost, power, counter_plus, tags, is_alt_art, is_manga, is_sp, url, image_url')
    .ilike('name', `%${name}%`)

  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  return attachPrices(data as CardResult[])
}