import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client instance for frontend operations
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Admin instance for backend operations (has full access)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Database types
export interface Database {
  public: {
    Tables: {
      email_recipients: {
        Row: {
          id: string
          name: string
          email: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          is_active?: boolean
          created_at?: string
        }
      }
      search_settings: {
        Row: {
          id: string
          time_window_hours: number
          sources: string[]
          keywords: string[]
          max_articles: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          time_window_hours: number
          sources: string[]
          keywords: string[]
          max_articles: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          time_window_hours?: number
          sources?: string[]
          keywords?: string[]
          max_articles?: number
          created_at?: string
          updated_at?: string
        }
      }
      system_settings: {
        Row: {
          id: string
          schedule_time: string
          summary_length: string
          include_images: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          schedule_time: string
          summary_length: string
          include_images: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          schedule_time?: string
          summary_length?: string
          include_images?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      articles: {
        Row: {
          id: string
          title: string
          url: string
          source: string
          published_date: string
          relevance_score: number
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          url: string
          source: string
          published_date: string
          relevance_score: number
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          url?: string
          source?: string
          published_date?: string
          relevance_score?: number
          content?: string
          created_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: string
          date: string
          daily_overview: string
          top_10_summary: string
          featured_articles: string[]
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          daily_overview: string
          top_10_summary: string
          featured_articles: string[]
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          daily_overview?: string
          top_10_summary?: string
          featured_articles?: string[]
          created_at?: string
        }
      }
    }
  }
}
