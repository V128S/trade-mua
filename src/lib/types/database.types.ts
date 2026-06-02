// src/lib/types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type UserRole = 'customer' | 'admin' | 'director'

export interface OrderItem {
  product_id: string
  name: string
  price_usdt: number
  qty: number
  image_url?: string | null
}

export interface Database {
  public: {
    Views: Record<string, never>
    Functions: {
      validate_promo: { Args: { p_code: string }; Returns: number }
      redeem_promo: { Args: { p_code: string }; Returns: number }
    }
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
        Relationships: []
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
          recipient_first_name: string | null
          recipient_last_name: string | null
          recipient_phone: string | null
          city: string | null
          nova_poshta_branch: string | null
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
          recipient_first_name?: string | null
          recipient_last_name?: string | null
          recipient_phone?: string | null
          city?: string | null
          nova_poshta_branch?: string | null
          nova_poshta_address?: string | null
          notes?: string | null
        }
        Update: {
          status?: OrderStatus
          nova_poshta_address?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          author_name: string
          author_location: string | null
          rating: number
          review_text: string
          manager_reply: string | null
          review_date: string
          telegram_url: string | null
          is_published: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          author_name: string
          author_location?: string | null
          rating?: number
          review_text: string
          manager_reply?: string | null
          review_date?: string
          telegram_url?: string | null
          is_published?: boolean
          sort_order?: number
        }
        Update: {
          author_name?: string
          author_location?: string | null
          rating?: number
          review_text?: string
          manager_reply?: string | null
          review_date?: string
          telegram_url?: string | null
          is_published?: boolean
          sort_order?: number
        }
        Relationships: []
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
        Relationships: []
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
          image_url: string | null
          image_url_admin: string | null
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
          image_url?: string | null
          image_url_admin?: string | null
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
          image_url?: string | null
          image_url_admin?: string | null
          synced_at?: string
        }
        Relationships: []
      }
    }
  }
}
