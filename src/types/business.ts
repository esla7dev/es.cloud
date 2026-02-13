export interface SearchResult {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  category: string;
  coordinates: { lat: number; lng: number };
  hours?: string;
  priceLevel?: string;
  businessStatus?: string;
  isOpen?: boolean;
  googleUrl?: string;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface SearchParams {
  keywords: string;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  placeId?: string;
  category: string;
  radius: number;
}

export interface Search {
  id: string;
  user_id: string;
  keywords: string;
  location: string;
  category: string;
  radius: number;
  coordinates: { lat: number; lng: number } | null;
  results_count: number;
  created_at: string;
  business_results?: SearchResult[];
}

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  updated_at: string;
  company_name?: string;
  sender_name?: string;
  phone?: string;
  address?: string;
  website?: string;
  role: 'user' | 'owner';
}

export interface BusinessCategory {
  value: string;
  label: string;
}

export interface Campaign {
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
  default_offer_template_id?: string;
  default_follow_up_template_id?: string;
  created_at: string;
  updated_at: string;
  search?: Search;
}

export interface CampaignBusinessInteraction {
  id: string;
  campaign_id: string;
  business_result_id: string;
  status: 'not_contacted' | 'sent' | 'in_progress' | 'client_acquired' | 'lost_rejected';
  last_action: string | null;
  last_action_at: string | null;
  mrr_value: number | null;
  one_time_deal_value: number | null;
  product_id: string | null;
  created_at: string;
  updated_at: string;
  business_result?: SearchResult;
  product?: Product;
}

export interface CampaignWithInteractions extends Campaign {
  interactions?: CampaignBusinessInteraction[];
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  type: 'offer' | 'follow_up';
  subject: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  phone: string;
  message: string;
  businessName: string;
  templateType: 'offer' | 'follow_up';
}
// New interface for Product
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price_credits: number;
  type: string;
  category: 'web_dev' | 'marketing' | 'arch_studio';
  image_url: string | null;
  features: string[];
  is_active: boolean;
  display_order: number;
  price_display: string | null;
  tier: 'basic' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// CRM Interfaces
export interface BusinessNote {
  id: string;
  business_result_id: string;
  user_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  usage_count?: number;
}

export interface Task {
  id: string;
  user_id: string;
  interaction_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface InteractionStatusHistory {
  id: string;
  interaction_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
}

// Analytics Interfaces
export interface ConversionFunnel {
  not_contacted: number;
  sent: number;
  in_progress: number;
  client_acquired: number;
  lost_rejected: number;
}

export interface AnalyticsData {
  total_revenue: number;
  total_mrr: number;
  total_deals: number;
  clients_acquired: number;
  total_contacted: number;
  conversion_rate: number;
  avg_deal_size: number;
  campaigns_count: number;
  active_campaigns_count: number;
  conversion_funnel: ConversionFunnel;
}

export interface CampaignRevenue {
  campaign_id: string;
  campaign_name: string;
  campaign_created_at: string;
  total_interactions: number;
  clients_acquired: number;
  total_mrr: number;
  total_deals: number;
  avg_mrr: number;
  avg_deal_value: number;
  conversion_rate: number;
  last_activity_at: string | null;
}

export interface ProductRevenueData {
  product_id: string;
  product_name: string;
  product_category: string;
  product_type: string;
  product_tier: string;
  total_revenue: number;
  total_mrr: number;
  total_deals: number;
  clients_count: number;
}

export interface RevenueByDate {
  date: string;
  mrr: number;
  deals: number;
  total: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}