export type PropertyType = 'Maison' | 'Appartement' | 'Studio' | 'Villa' | 'Bureau' | 'Autre';

export type ListingStatus = 'active' | 'pending_payment' | 'suspended' | 'expired';

export type PublicationMode = 'paid' | 'free';

export interface Listing {
  id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  price: number;
  currency: string;
  caution_months: number;
  bedrooms: number;
  bathrooms: number;
  surface_sqm: number;
  parking_spaces: number;
  country: string;
  country_code: string;
  city: string;
  neighborhood: string;
  address?: string;
  photos: string[];
  amenities: string[];
  whatsapp_number: string;
  phone_number: string;
  advertiser_name: string;
  status: ListingStatus;
  publication_mode: PublicationMode;
  duration_days: number;
  published_at: string;
  expires_at: string;
  featured?: boolean;
  views_count?: number;
  created_at?: string;
}

export interface PublicationPlan {
  id: string;
  title: string;
  duration_days: number;
  duration_label: string;
  price_fcfa: number;
  is_active: boolean;
  sort_order?: number;
}

export interface PlatformSettings {
  id: string;
  mode_publication: PublicationMode; // 'paid' or 'free'
  allow_instant_publish: boolean;
  allow_homepage_promo_ads: boolean; // 2.1 Activer ou désactiver les annonces promotionnelles sur la page d’accueil
  allow_public_listings: boolean; // 2.2 Activer ou désactiver le bouton « Publier une annonce »
  support_phone?: string;
  support_whatsapp?: string;
  support_email?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  listing_id?: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  payment_method: string;
  payer_name?: string;
  payer_phone?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string;
  admin_email: string;
  created_at: string;
}

export interface GeoLocation {
  id?: string;
  country: string;
  country_code: string;
  city: string;
  neighborhoods: string[];
}

export interface SearchFilters {
  country?: string;
  city?: string;
  neighborhood?: string;
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  amenities?: string[];
  caution_months?: number;
  keyword?: string;
}


// Promo Codes
export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discount_type: 'free_publication' | 'percentage' | 'fixed_amount';
  discount_value: number; // 100 for free_publication
  max_uses: number;
  current_uses: number;
  max_users?: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  is_banner_published: boolean; // Indépendant de is_active
  banner_text?: string;
  created_at: string;
  created_by?: string;
}

export interface PromoCodeUse {
  id: string;
  promo_code_id: string;
  code: string;
  listing_id?: string;
  user_phone?: string;
  user_email?: string;
  discount_applied: number;
  used_at: string;
}

// Visitor Analytics
export interface VisitorDailyStat {
  date: string;
  total_visits: number;
  unique_visitors: number;
  repeated_visits: number;
}

export interface VisitorHourlyStat {
  hour: number;
  visits: number;
}

export interface VisitorCountryStat {
  country: string;
  country_code: string;
  flag: string;
  visits: number;
  percentage: number;
}

// User Interactions & Traceability
export interface PageVisitStat {
  path: string;
  name: string;
  views: number;
  avg_time_seconds: number;
  exit_rate_percentage: number;
}

export interface ButtonClickStat {
  button_id: string;
  button_label: string;
  feature_name: string;
  category: 'whatsapp' | 'call' | 'publish' | 'filter' | 'favorite' | 'navigation' | 'review' | 'promo' | 'other';
  click_count: number;
  action_count: number;
  conversion_rate?: number;
  last_clicked_at: string;
}

export interface NavigationFunnelStep {
  step: string;
  label: string;
  visitors: number;
  conversion_rate: number;
}

export interface UserExitStat {
  path: string;
  page_title: string;
  exit_count: number;
  exit_percentage: number;
}

// Site Customization & Modular Settings
export interface SiteCustomization {
  site_title: string;
  slogan: string;
  subtitle: string;
  hero_badge_text: string;
  anti_fraud_warning_text: string;
  
  // Theme & Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  card_background_color: string;
  text_color: string;
  link_color: string;
  
  // Buttons
  button_primary_bg: string;
  button_primary_hover: string;
  button_disabled_bg: string;
  button_text_color: string;
  
  // Borders & Radii
  border_color: string;
  border_width: string; // '1px', '2px', etc.
  border_style: 'solid' | 'dashed' | 'dotted';
  border_radius: string; // '8px', '12px', '16px', '24px'
  
  // Inputs & Modals
  input_bg: string;
  input_border_color: string;
  modal_bg: string;
  menu_bg: string;

  // Sections Display
  show_hero_section: boolean;
  show_reassurance_badges: boolean;
  show_anti_fraud_banner: boolean;
  show_featured_section: boolean;
  show_cta_publish_banner: boolean;
  
  // Announcements
  announcement_banner_enabled: boolean;
  announcement_banner_text: string;
  announcement_banner_type: 'info' | 'warning' | 'success';
}

// Listing Reviews
export interface ListingReview {
  id: string;
  listing_id: string;
  author_name: string;
  rating: number; // 1-5
  comment: string;
  is_reported: boolean;
  report_reason?: string;
  status: 'approved' | 'pending' | 'rejected';
  visitor_id?: string;
  created_at: string;
}

export interface AdminSecurityProfile {
  email: string;
  last_password_change?: string;
  last_security_check?: string;
  session_timeout_minutes: number;
  two_factor_recommended: boolean;
}
