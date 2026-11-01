import { supabase } from '@/db/supabase';
import type {
  Listing,
  ListingStatus,
  PlatformSettings,
  PublicationPlan,
  SearchFilters,
  Transaction,
  AuditLog,
  GeoLocation,
} from '@/types';

// Fallback seed listings in case of network issue
const FALLBACK_LISTINGS: Listing[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Belle maison moderne à louer',
    description:
      'Belle maison moderne située dans un quartier calme et sécurisé de Talangaï. La maison dispose de 4 chambres, un grand salon, une cuisine équipée moderne, un parking pour 2 véhicules, un jardin arboré et une piscine privative. Idéale pour une famille.',
    property_type: 'Maison',
    price: 350000,
    currency: 'FCFA',
    caution_months: 2,
    bedrooms: 4,
    bathrooms: 3,
    surface_sqm: 200,
    parking_spaces: 2,
    country: 'Congo',
    country_code: 'CG',
    city: 'Brazzaville',
    neighborhood: 'Talangaï',
    address: 'Avenue des Martyrs, Talangaï',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3db4fbe5-612c-49b5-8b96-6768eced7e49.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0d0af3d4-72be-4dda-9efd-2020ebcd456a.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_87425865-c7d0-4253-af90-e4717c67a2ef.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_542a2ab1-f527-4bb7-a4e6-a423652af599.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_45370c5a-8dd8-445f-a364-f02864b15009.jpg',
    ],
    amenities: [
      'Électricité',
      'Eau courante',
      'Climatisation',
      'Parking',
      'Garage',
      'Wi-Fi',
      'Sécurité',
      'Cuisine équipée',
      'Piscine',
      'Jardin',
    ],
    whatsapp_number: '+242065432190',
    phone_number: '+242 06 543 2190',
    advertiser_name: 'Immo Congo Prestige',
    status: 'active',
    publication_mode: 'paid',
    duration_days: 30,
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
    featured: true,
    views_count: 342,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Appartement standing et lumineux',
    description:
      'Superbe appartement meublé et décoré avec goût à Cocody, Abidjan. Grand séjour baigné de lumière naturelle, cuisine américaine équipée, chambre parentale avec salle de bain attenante.',
    property_type: 'Appartement',
    price: 250000,
    currency: 'FCFA',
    caution_months: 2,
    bedrooms: 2,
    bathrooms: 1,
    surface_sqm: 120,
    parking_spaces: 1,
    country: "Côte d'Ivoire",
    country_code: 'CI',
    city: 'Abidjan',
    neighborhood: 'Cocody',
    address: 'Boulevard François Mitterrand, Cocody',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3db4fbe5-612c-49b5-8b96-6768eced7e49.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a0cef262-2512-427c-aab6-0f63e9b7026e.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e4846bc-bf59-4c58-830b-96419873db4a.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_87425865-c7d0-4253-af90-e4717c67a2ef.jpg',
    ],
    amenities: [
      'Électricité',
      'Eau courante',
      'Climatisation',
      'Parking',
      'Wi-Fi',
      'Sécurité',
      'Cuisine équipée',
    ],
    whatsapp_number: '+2250701020304',
    phone_number: '+225 07 01 02 03 04',
    advertiser_name: 'Koffi Immobilier Abidjan',
    status: 'active',
    publication_mode: 'paid',
    duration_days: 14,
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 13 * 86400000).toISOString(),
    featured: true,
    views_count: 215,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Studio cosy tout confort',
    description:
      'Charmant studio entièrement aménagé à Ouakam / Mermoz, Dakar. Très bien situé à proximité des commerces, des universités et des transports. Climatisation, internet fibre inclus.',
    property_type: 'Studio',
    price: 80000,
    currency: 'FCFA',
    caution_months: 1,
    bedrooms: 1,
    bathrooms: 1,
    surface_sqm: 40,
    parking_spaces: 0,
    country: 'Sénégal',
    country_code: 'SN',
    city: 'Dakar',
    neighborhood: 'Ouakam',
    address: 'Rue 14, Ouakam, Dakar',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_597e44c5-1c53-417f-9123-cd9597302290.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e4846bc-bf59-4c58-830b-96419873db4a.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_542a2ab1-f527-4bb7-a4e6-a423652af599.jpg',
    ],
    amenities: ['Électricité', 'Eau courante', 'Climatisation', 'Wi-Fi', 'Sécurité'],
    whatsapp_number: '+221776543210',
    phone_number: '+221 77 654 3210',
    advertiser_name: 'Diallo Résidences',
    status: 'active',
    publication_mode: 'free',
    duration_days: 7,
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 4 * 86400000).toISOString(),
    featured: true,
    views_count: 180,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Villa de prestige avec piscine et jardin',
    description:
      'Somptueuse villa de grand luxe située dans le quartier résidentiel de la Haie Vive à Cotonou. 5 chambres spacieuses ou pièces de vie, piscine privée et grand garage.',
    property_type: 'Villa',
    price: 500000,
    currency: 'FCFA',
    caution_months: 3,
    bedrooms: 5,
    bathrooms: 4,
    surface_sqm: 350,
    parking_spaces: 3,
    country: 'Bénin',
    country_code: 'BJ',
    city: 'Cotonou',
    neighborhood: 'Haie Vive',
    address: 'Avenue Jean-Paul II, Haie Vive',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_45370c5a-8dd8-445f-a364-f02864b15009.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a0cef262-2512-427c-aab6-0f63e9b7026e.jpg',
    ],
    amenities: [
      'Électricité',
      'Eau courante',
      'Climatisation',
      'Parking',
      'Garage',
      'Wi-Fi',
      'Sécurité',
      'Cuisine équipée',
      'Piscine',
      'Jardin',
    ],
    whatsapp_number: '+22997123456',
    phone_number: '+229 97 12 34 56',
    advertiser_name: 'Cabinet Immo Bénin',
    status: 'active',
    publication_mode: 'paid',
    duration_days: 30,
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
    featured: true,
    views_count: 512,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Villa contemporaine d architecte',
    description:
      'Magnifique villa d architecte située au coeur d East Legon à Accra. Séjour double hauteur, cuisine équipée, piscine privée.',
    property_type: 'Villa',
    price: 800000,
    currency: 'FCFA',
    caution_months: 2,
    bedrooms: 4,
    bathrooms: 3,
    surface_sqm: 280,
    parking_spaces: 2,
    country: 'Bénin',
    country_code: 'BJ',
    city: 'Cotonou',
    neighborhood: 'Haie Vive',
    address: 'Avenue Jean-Paul II, Haie Vive',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_639efd4a-4b91-48f6-903e-baecd5cf4d60.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
    ],
    amenities: [
      'Électricité',
      'Eau courante',
      'Climatisation',
      'Parking',
      'Garage',
      'Wi-Fi',
      'Sécurité',
      'Cuisine équipée',
      'Piscine',
    ],
    whatsapp_number: '+22997010203',
    phone_number: '+229 97 01 02 03',
    advertiser_name: 'Cotonou Prestige Immobilier',
    status: 'active',
    publication_mode: 'paid',
    duration_days: 30,
    published_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 23 * 86400000).toISOString(),
    featured: true,
    views_count: 420,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Studio moderne meublé à Bastos',
    description:
      'Studio spacieux et calme à Bastos, Yaoundé. Idéal pour diplomates ou consultants en mission.',
    property_type: 'Studio',
    price: 120000,
    currency: 'FCFA',
    caution_months: 1,
    bedrooms: 1,
    bathrooms: 1,
    surface_sqm: 45,
    parking_spaces: 1,
    country: 'Cameroun',
    country_code: 'CM',
    city: 'Yaoundé',
    neighborhood: 'Bastos',
    address: 'Rue des Ambassades, Bastos',
    photos: [
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_597e44c5-1c53-417f-9123-cd9597302290.jpg',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e4846bc-bf59-4c58-830b-96419873db4a.jpg',
    ],
    amenities: ['Électricité', 'Eau courante', 'Climatisation', 'Parking', 'Wi-Fi', 'Sécurité'],
    whatsapp_number: '+237699112233',
    phone_number: '+237 6 99 11 22 33',
    advertiser_name: 'Bastos Immo Agency',
    status: 'active',
    publication_mode: 'paid',
    duration_days: 14,
    published_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 12 * 86400000).toISOString(),
    featured: true,
    views_count: 145,
  },
];

export const listingService = {
  // Fetch active listings for public views (filters out expired listings automatically)
  async getActiveListings(filters?: SearchFilters, visitorCountry: string = 'Congo'): Promise<Listing[]> {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false });

      if (filters?.country && filters.country !== 'all') {
        query = query.ilike('country', `%${filters.country}%`);
      }
      if (filters?.city && filters.city !== 'all') {
        query = query.ilike('city', `%${filters.city}%`);
      }
      if (filters?.neighborhood && filters.neighborhood !== 'all') {
        query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
      }
      if (filters?.property_type && filters.property_type !== 'all') {
        query = query.eq('property_type', filters.property_type);
      }
      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters?.caution_months) {
        query = query.lte('caution_months', filters.caution_months);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return this.filterFallback(FALLBACK_LISTINGS, filters, visitorCountry);
      }

      let results: Listing[] = data as Listing[];

      // In-memory filter for amenities and keyword if present
      if (filters?.amenities && filters.amenities.length > 0) {
        results = results.filter((item) =>
          filters.amenities!.every((a) => item.amenities && item.amenities.includes(a))
        );
      }
      if (filters?.keyword) {
        const kw = filters.keyword.toLowerCase();
        results = results.filter(
          (item) =>
            item.title.toLowerCase().includes(kw) ||
            item.description.toLowerCase().includes(kw) ||
            item.neighborhood.toLowerCase().includes(kw) ||
            item.city.toLowerCase().includes(kw)
        );
      }

      // If no explicit country/city filter was passed, apply the 75% local / 25% international algorithm
      const hasSpecificFilter = Boolean(filters?.country || filters?.city || filters?.neighborhood);
      if (!hasSpecificFilter && results.length > 0) {
        results = this.applyGeoRecommendation(results, visitorCountry);
      }

      return results;
    } catch {
      return this.filterFallback(FALLBACK_LISTINGS, filters, visitorCountry);
    }
  },

  // Apply the 75% visitor country / 25% international recommendation algorithm
  applyGeoRecommendation(items: Listing[], visitorCountry: string): Listing[] {
    const local = items.filter(
      (item) => item.country.toLowerCase() === visitorCountry.toLowerCase()
    );
    const international = items.filter(
      (item) => item.country.toLowerCase() !== visitorCountry.toLowerCase()
    );

    if (local.length === 0) return international;
    if (international.length === 0) return local;

    // Build balanced array aiming at 75% local and 25% international
    const combined: Listing[] = [];
    let localIdx = 0;
    let intlIdx = 0;

    while (localIdx < local.length || intlIdx < international.length) {
      // Add up to 3 local items
      for (let i = 0; i < 3 && localIdx < local.length; i++) {
        combined.push(local[localIdx++]);
      }
      // Add 1 international item
      if (intlIdx < international.length) {
        combined.push(international[intlIdx++]);
      }
      // If no international left, flush remaining local
      if (intlIdx >= international.length && localIdx < local.length) {
        combined.push(local[localIdx++]);
      }
      // If no local left, flush remaining international
      if (localIdx >= local.length && intlIdx < international.length) {
        combined.push(international[intlIdx++]);
      }
    }

    return combined;
  },

  filterFallback(items: Listing[], filters?: SearchFilters, visitorCountry: string = 'Congo'): Listing[] {
    const now = Date.now();
    let res = items.filter((item) => item.status === 'active' && new Date(item.expires_at).getTime() > now);

    if (filters?.country && filters.country !== 'all') {
      res = res.filter((item) => item.country.toLowerCase().includes(filters.country!.toLowerCase()));
    }
    if (filters?.city && filters.city !== 'all') {
      res = res.filter((item) => item.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }
    if (filters?.neighborhood && filters.neighborhood !== 'all') {
      res = res.filter((item) =>
        item.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase())
      );
    }
    if (filters?.property_type && filters.property_type !== 'all') {
      res = res.filter((item) => item.property_type === filters.property_type);
    }
    if (filters?.min_price) {
      res = res.filter((item) => item.price >= filters.min_price!);
    }
    if (filters?.max_price) {
      res = res.filter((item) => item.price <= filters.max_price!);
    }
    if (filters?.bedrooms) {
      res = res.filter((item) => item.bedrooms >= filters.bedrooms!);
    }
    if (filters?.amenities && filters.amenities.length > 0) {
      res = res.filter((item) =>
        filters.amenities!.every((a) => item.amenities && item.amenities.includes(a))
      );
    }

    const hasSpecificFilter = Boolean(filters?.country || filters?.city || filters?.neighborhood);
    if (!hasSpecificFilter && res.length > 0) {
      res = this.applyGeoRecommendation(res, visitorCountry);
    }

    return res;
  },

  // Get single listing by ID
  async getListingById(id: string): Promise<Listing | null> {
    try {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).single();
      if (error || !data) {
        const fallback = FALLBACK_LISTINGS.find((l) => l.id === id);
        return fallback || null;
      }
      return data as Listing;
    } catch {
      return FALLBACK_LISTINGS.find((l) => l.id === id) || null;
    }
  },

  // Create new listing
  async createListing(
    listingData: Omit<Listing, 'id' | 'published_at' | 'expires_at' | 'views_count'>
  ): Promise<Listing> {
    const settings = await this.getPlatformSettings();
    if (settings.allow_public_listings === false) {
      throw new Error(
        'La publication de nouvelles annonces est temporairement suspendue par l\'administrateur.'
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (listingData.duration_days || 30) * 86400000);

    const payload = {
      ...listingData,
      published_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      views_count: 0,
    };

    try {
      const { data, error } = await supabase.from('listings').insert([payload]).select().single();
      if (error || !data) {
        throw error || new Error('Erreur lors de la création de l annonce');
      }
      return data as Listing;
    } catch {
      // In mock fallback mode: create in-memory representation
      const mockListing: Listing = {
        ...payload,
        id: `mock-${Date.now()}`,
      };
      FALLBACK_LISTINGS.unshift(mockListing);
      return mockListing;
    }
  },

  // Admin: Get all listings with optional status filter
  async getAllListings(statusFilter?: ListingStatus | 'all'): Promise<Listing[]> {
    try {
      let query = supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error || !data) {
        return FALLBACK_LISTINGS;
      }
      return data as Listing[];
    } catch {
      return FALLBACK_LISTINGS;
    }
  },

  // Admin: Update listing status (e.g. approve, suspend)
  async updateListingStatus(id: string, status: ListingStatus): Promise<boolean> {
    try {
      const { error } = await supabase.from('listings').update({ status }).eq('id', id);
      if (error) throw error;
      await this.logAuditAction('MODERATION_ANNONCE', `Statut de l annonce ${id} modifié à ${status}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Extend duration
  async extendListingDuration(id: string, extraDays: number): Promise<boolean> {
    try {
      const item = await this.getListingById(id);
      if (!item) return false;
      const currentExpiry = new Date(item.expires_at).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + extraDays * 86400000).toISOString();

      const { error: updateError } = await supabase
        .from('listings')
        .update({ expires_at: newExpiry, status: 'active' })
        .eq('id', id);
      if (updateError) throw updateError;

      await this.logAuditAction(
        'PROLONGATION_ANNONCE',
        `Prolongation de l annonce ${id} de ${extraDays} jours jusqu au ${new Date(newExpiry).toLocaleDateString()}`
      );
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Admin: Delete listing
  async deleteListing(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('listings').delete().eq('id', id);
      if (error) throw error;
      await this.logAuditAction('SUPPRESSION_ANNONCE', `Suppression de l annonce ${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Platform Settings
  async getPlatformSettings(): Promise<PlatformSettings> {
    const STORAGE_KEY_PLATFORM_SETTINGS = 'ndako_platform_settings_v2';
    let localSett: PlatformSettings | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PLATFORM_SETTINGS);
      if (raw) localSett = JSON.parse(raw);
    } catch {
      // ignore
    }

    const defaultSettings: PlatformSettings = {
      id: 'default',
      mode_publication: 'paid',
      allow_instant_publish: true,
      allow_homepage_promo_ads: true,
      allow_public_listings: true,
      support_phone: '+242 06 543 2190',
      support_whatsapp: '+242 06 543 2190',
      support_email: 'support@ndako.cg',
    };

    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      if (!error && data) {
        return {
          ...defaultSettings,
          ...localSett,
          ...data,
          allow_homepage_promo_ads: data.allow_homepage_promo_ads !== undefined ? data.allow_homepage_promo_ads : (localSett?.allow_homepage_promo_ads ?? true),
          allow_public_listings: data.allow_public_listings !== undefined ? data.allow_public_listings : (localSett?.allow_public_listings ?? true),
        } as PlatformSettings;
      }
    } catch {
      // fallback
    }

    return {
      ...defaultSettings,
      ...(localSett || {}),
    };
  },

  // Admin: Toggle publication mode ('paid' vs 'free')
  async setPublicationMode(mode: 'paid' | 'free'): Promise<boolean> {
    return this.updatePlatformSettings({ mode_publication: mode });
  },

  // Admin: Update all platform settings
  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<boolean> {
    const STORAGE_KEY_PLATFORM_SETTINGS = 'ndako_platform_settings_v2';
    try {
      const current = await this.getPlatformSettings();
      const updated = { ...current, ...settings, updated_at: new Date().toISOString() };
      const { error } = await supabase
        .from('platform_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', 'default');
      if (error) throw error;
      localStorage.setItem(STORAGE_KEY_PLATFORM_SETTINGS, JSON.stringify(updated));
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Record audit log alias
  async recordAuditLog(log: { action: string; details: string; admin_email?: string }): Promise<void> {
    await this.logAuditAction(log.action, log.details, log.admin_email);
  },

  // Publication Plans
  async getPublicationPlans(): Promise<PublicationPlan[]> {
    try {
      const { data, error } = await supabase
        .from('publication_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error || !data || data.length === 0) {
        return [
          { id: 'plan_1_week', title: '1 semaine', duration_days: 7, duration_label: '7 jours', price_fcfa: 500, is_active: true },
          { id: 'plan_2_weeks', title: '2 semaines', duration_days: 14, duration_label: '14 jours', price_fcfa: 1000, is_active: true },
          { id: 'plan_1_month', title: '1 mois', duration_days: 30, duration_label: '30 jours', price_fcfa: 3000, is_active: true },
        ];
      }
      return data as PublicationPlan[];
    } catch {
      return [
        { id: 'plan_1_week', title: '1 semaine', duration_days: 7, duration_label: '7 jours', price_fcfa: 500, is_active: true },
        { id: 'plan_2_weeks', title: '2 semaines', duration_days: 14, duration_label: '14 jours', price_fcfa: 1000, is_active: true },
        { id: 'plan_1_month', title: '1 mois', duration_days: 30, duration_label: '30 jours', price_fcfa: 3000, is_active: true },
      ];
    }
  },

  // Admin: Update Plan Price
  async updatePlanPrice(planId: string, newPrice: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('publication_plans')
        .update({ price_fcfa: newPrice })
        .eq('id', planId);
      if (error) throw error;
      await this.logAuditAction('MODIF_TARIF_FORMULE', `Formule ${planId} mise à jour à ${newPrice} FCFA`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as Transaction[];
    } catch {
      return [];
    }
  },

  async recordTransaction(
    txn: Omit<Transaction, 'id' | 'created_at'>
  ): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase.from('transactions').insert([txn]).select().single();
      if (error) throw error;
      return data as Transaction;
    } catch {
      return null;
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data as AuditLog[];
    } catch {
      return [];
    }
  },

  async logAuditAction(action: string, details?: string, adminEmail?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert([
        { action, details, admin_email: adminEmail || user?.email || 'admin@ndako.local' },
      ]);
    } catch {
      // ignore
    }
  },

  // Geo locations
  async getGeoLocations(): Promise<GeoLocation[]> {
    try {
      const { data, error } = await supabase.from('geo_locations').select('*');
      if (error || !data || data.length === 0) {
        return [
          { country: 'Congo', country_code: 'CG', city: 'Brazzaville', neighborhoods: ['Talangaï', 'Bacongo', 'Moungali', 'Makélékélé', 'Ouenzé', 'Centre-ville'] },
          { country: 'Congo', country_code: 'CG', city: 'Pointe-Noire', neighborhoods: ['Tié-Tié', 'Lumumba', 'Loandjili', 'Ngoyo'] },
          { country: "Côte d'Ivoire", country_code: 'CI', city: 'Abidjan', neighborhoods: ['Cocody', 'Plateau', 'Yopougon', 'Marcory', 'Riviera'] },
          { country: 'Sénégal', country_code: 'SN', city: 'Dakar', neighborhoods: ['Mermoz', 'Almadies', 'Ouakam', 'Plateau', 'Fann'] },
          { country: 'Cameroun', country_code: 'CM', city: 'Yaoundé', neighborhoods: ['Bastos', 'Omnisports', 'Biyem-Assi'] },
          { country: 'Cameroun', country_code: 'CM', city: 'Douala', neighborhoods: ['Bonanjo', 'Akwa', 'Bonapriso', 'Makepe'] },
          { country: 'Bénin', country_code: 'BJ', city: 'Cotonou', neighborhoods: ['Haie Vive', 'Ganhi', 'Cadjehoun', 'Fidjrossè', 'Akpakpa'] },
          { country: 'Bénin', country_code: 'BJ', city: 'Porto-Novo', neighborhoods: ['Centre-ville', 'Ouando', 'Dowa'] },
        ];
      }
      return data as GeoLocation[];
    } catch {
      return [];
    }
  },

  // Direct photo upload to Supabase Storage
  async uploadListingPhoto(file: File): Promise<string> {
    try {
      const extensionByMime: Record<string, string> = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
      const fileExt = extensionByMime[file.type];
      if (!fileExt || file.size > 5 * 1024 * 1024) return '';
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return '';
      }

      const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
      return data?.publicUrl || '';
    } catch {
      return '';
    }
  },
};
