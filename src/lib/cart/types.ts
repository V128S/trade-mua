export interface CartItem {
  id: string
  name: string
  hashrate: string
  powerW: number
  priceUSDT: number
  qty: number
  imageUrl?: string | null
}
