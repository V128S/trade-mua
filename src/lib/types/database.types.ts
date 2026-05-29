// src/lib/types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type UserRole = 'customer' | 'admin'

export interface OrderItem {
  product_id: string
  name: string
  price_usdt: number
  qty: number
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          items: OrderItem[]
          total_usdt: number
          status: OrderStatus
          promo_code: string | null
          discount_pct: number | null
          nova_poshta_address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          items: OrderItem[]
          total_usdt: number
          status?: OrderStatus
          promo_code?: string | null
          discount_pct?: number | null
          nova_poshta_address?: string | null
          notes?: string | null
        }
        Update: {
          status?: OrderStatus
          nova_poshta_address?: string | null
          notes?: string | null
        }
      }
      promo_codes: {
        Row: {
          id: string
          code: string
          discount_pct: number
          max_uses: number | null
          uses_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          discount_pct: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          discount_pct?: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          algorithm: string
          brand: string
          name: string
          hashrate: string
          power_w: number
          price_usdt: number
          in_stock: boolean
          is_new: boolean
          synced_at: string
        }
        Insert: {
          id: string
          algorithm: string
          brand: string
          name: string
          hashrate: string
          power_w: number
          price_usdt: number
          in_stock: boolean
          is_new: boolean
          synced_at?: string
        }
        Update: {
          algorithm?: string
          brand?: string
          name?: string
          hashrate?: string
          power_w?: number
          price_usdt?: number
          in_stock?: boolean
          is_new?: boolean
          synced_at?: string
        }
      }
    }
  }
}
