import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          credits: number;
          created_at: string;
          updated_at: string;
          company_name: string | null;
          sender_name: string | null;
          phone: string | null;
          address: string | null;
          website: string | null;
          role: 'user' | 'owner';
        };
        Insert: {
          id: string;
          email: string;
          credits?: number;
          company_name?: string;
          sender_name?: string;
          phone?: string;
          address?: string;
          website?: string;
          role?: 'user' | 'owner';
        };
        Update: {
          credits?: number;
          updated_at?: string;
          company_name?: string;
          sender_name?: string;
          phone?: string;
          address?: string;
          website?: string;
          role?: 'user' | 'owner';
        };
      };
      searches: {
        Row: {
          id: string;
          user_id: string;
          keywords: string;
          location: string;
          category: string | null;
          radius: number;
          coordinates: any;
          results_count: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          keywords: string;
          location: string;
          category?: string;
          radius?: number;
          coordinates?: any;
          results_count?: number;
        };
        Update: {
          results_count?: number;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          search_id: string;
          status: 'draft' | 'active' | 'paused' | 'completed';
          progress: number;
          total_businesses: number;
          websites_extracted: number;
          phones_extracted: number;
          contacted_businesses: number;
          target_country_code: string;
          default_offer_template_id: string | null;
          default_follow_up_template_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          search_id: string;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          progress?: number;
          total_businesses?: number;
          websites_extracted?: number;
          phones_extracted?: number;
          contacted_businesses?: number;
          target_country_code?: string;
          default_offer_template_id?: string;
          default_follow_up_template_id?: string;
        };
        Update: {
          name?: string;
          status?: 'draft' | 'active' | 'paused' | 'completed';
          progress?: number;
          total_businesses?: number;
          websites_extracted?: number;
          phones_extracted?: number;
          contacted_businesses?: number;
          target_country_code?: string;
          default_offer_template_id?: string;
          default_follow_up_template_id?: string;
          updated_at?: string;
        };
      };
      business_results: {
        Row: {
          id: string;
          search_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          website: string | null;
          rating: number | null;
          review_count: number;
          category: string | null;
          coordinates: any;
          hours: string | null;
          price_level: string | null;
          created_at: string;
        };
        Insert: {
          search_id: string;
          name: string;
          address?: string;
          phone?: string;
          website?: string;
          rating?: number;
          review_count?: number;
          category?: string;
          coordinates?: any;
          hours?: string;
          price_level?: string;
        };
        Update: {};
      };
      campaign_business_interactions: {
        Row: {
          id: string;
          campaign_id: string;
          business_result_id: string;
          status: string;
          last_action: string | null;
          last_action_at: string | null;
          mrr_value: number | null;
          one_time_deal_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          campaign_id: string;
          business_result_id: string;
          status?: string;
          last_action?: string;
          last_action_at?: string;
          mrr_value?: number;
          one_time_deal_value?: number;
        };
        Update: {
          status?: string;
          last_action?: string;
          last_action_at?: string;
          mrr_value?: number;
          one_time_deal_value?: number;
          updated_at?: string;
        };
      };
    };
    message_templates: {
      Row: {
        id: string;
        user_id: string;
        name: string;
        type: 'offer' | 'follow_up';
        subject: string;
        content: string;
        is_default: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        user_id: string;
        name: string;
        type: 'offer' | 'follow_up';
        subject: string;
        content: string;
        is_default?: boolean;
      };
      Update: {
        name?: string;
        subject?: string;
        content?: string;
        is_default?: boolean;
        updated_at?: string;
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_credits: number;
          type: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          name: string;
        };
      }
    }
  }
}