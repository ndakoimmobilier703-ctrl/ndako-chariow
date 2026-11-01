import { supabase } from '@/db/supabase';
import type { PromoCode, PromoCodeUse } from '@/types';

// Default initial promo codes
const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo-welcome-free',
    code: 'NDAKO-BIENVENUE',
    description: 'Offre spéciale de bienvenue : 1 publication gratuite pour les nouveaux bailleurs',
    discount_type: 'free_publication',
    discount_value: 100,
    max_uses: 100,
    current_uses: 14,
    max_users: 100,
    starts_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 60 * 86400000).toISOString(),
    is_active: true,
    is_banner_published: true, // Annonce visible à l'accueil
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_by: 'Administrateur',
  },
  {
    id: 'promo-congo-launch',
    code: 'CONGO2026',
    description: 'Gratuité totale pour célébrer le lancement au Congo et dans la sous-région',
    discount_type: 'free_publication',
    discount_value: 100,
    max_uses: 50,
    current_uses: 38,
    max_users: 50,
    starts_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    is_active: true,
    is_banner_published: false,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    created_by: 'Administrateur',
  },
  {
    id: 'promo-vip-brazza',
    code: 'IMMO-VIP',
    description: 'Code privilège agences et partenaires immobiliers agréés',
    discount_type: 'free_publication',
    discount_value: 100,
    max_uses: 20,
    current_uses: 5,
    max_users: 20,
    starts_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    expires_at: new Date(Date.now() + 90 * 86400000).toISOString(),
    is_active: true,
    is_banner_published: false,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_by: 'Administrateur',
  },
];

const DEFAULT_USES: PromoCodeUse[] = [
  {
    id: 'use-1',
    promo_code_id: 'promo-welcome-free',
    code: 'NDAKO-BIENVENUE',
    listing_id: '11111111-1111-1111-1111-111111111111',
    user_phone: '+242 06 543 2190',
    discount_applied: 3000,
    used_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'use-2',
    promo_code_id: 'promo-congo-launch',
    code: 'CONGO2026',
    listing_id: '22222222-2222-2222-2222-222222222222',
    user_phone: '+242 05 123 4567',
    discount_applied: 3000,
    used_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const STORAGE_KEY_PROMOS = 'ndako_promo_codes_v1';
const STORAGE_KEY_USES = 'ndako_promo_uses_v1';

export class PromoCodeService {
  private static getStoredPromos(): PromoCode[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROMOS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_PROMO_CODES;
  }

  private static saveStoredPromos(promos: PromoCode[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos));
    } catch {
      // ignore
    }
  }

  private static getStoredUses(): PromoCodeUse[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_USES;
  }

  private static saveStoredUses(uses: PromoCodeUse[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_USES, JSON.stringify(uses));
    } catch {
      // ignore
    }
  }

  /**
   * List all promotional codes
   */
  static async getAllPromoCodes(): Promise<PromoCode[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('promo_codes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as PromoCode[];
        }
      }
    } catch {
      // use local stored
    }
    return this.getStoredPromos();
  }

  /**
   * List all promo code usages
   */
  static async getAllPromoUses(): Promise<PromoCodeUse[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('promo_code_uses')
          .select('*')
          .order('used_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as PromoCodeUse[];
        }
      }
    } catch {
      // use local stored
    }
    return this.getStoredUses();
  }

  /**
   * Generate a unique promotional code string
   * format: NDAKO-XXXX-XXXX
   */
  static generateUniqueCode(prefix = 'NDAKO'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${part1}-${part2}`;
  }

  /**
   * Create a new promotional code
   */
  static async createPromoCode(params: {
    code?: string;
    description?: string;
    discount_type?: 'free_publication' | 'percentage' | 'fixed_amount';
    discount_value?: number;
    max_uses: number;
    max_users?: number;
    starts_at: string;
    expires_at: string;
  }): Promise<{ success: boolean; promo?: PromoCode; error?: string }> {
    const code = (params.code || this.generateUniqueCode()).trim().toUpperCase();

    // Check if code already exists
    const currentList = await this.getAllPromoCodes();
    if (currentList.some((p) => p.code.toUpperCase() === code)) {
      return { success: false, error: 'Ce code promotionnel existe déjà.' };
    }

    const newPromo: PromoCode = {
      id: '',
      code,
      description: params.description || 'Code promotionnel pour parution gratuite',
      discount_type: params.discount_type || 'free_publication',
      discount_value: params.discount_value ?? 100,
      max_uses: Math.max(1, params.max_uses),
      current_uses: 0,
      max_users: params.max_users ? Math.max(1, params.max_users) : params.max_uses,
      starts_at: params.starts_at,
      expires_at: params.expires_at,
      is_active: true,
      is_banner_published: false,
      banner_text: '',
      created_at: new Date().toISOString(),
      created_by: 'Administrateur',
    };

    try {
      const { id: _ignoredId, ...insertPayload } = newPromo;
      const { data, error } = await supabase.from('promo_codes').insert(insertPayload).select('*').single();
      if (error || !data) throw error || new Error('Enregistrement impossible.');
      const savedPromo = data as PromoCode;
      const updated = [savedPromo, ...currentList.filter((item) => item.code !== savedPromo.code)];
      this.saveStoredPromos(updated);
      return { success: true, promo: savedPromo };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Impossible d’enregistrer ce code promo.' };
    }
  }

  /**
   * Validate a promo code entered by user
   */
  static async validatePromoCode(
    inputCode: string,
    planPrice: number = 3000
  ): Promise<{
    valid: boolean;
    message: string;
    promo?: PromoCode;
    finalPrice: number;
    discountAmount: number;
  }> {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      return {
        valid: false,
        message: 'Veuillez saisir un code promotionnel.',
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    const allPromos = await this.getAllPromoCodes();
    const promo = allPromos.find((p) => p.code.toUpperCase() === cleanCode);

    if (!promo) {
      return {
        valid: false,
        message: 'Code promotionnel inexistant ou erroné.',
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    if (!promo.is_active) {
      return {
        valid: false,
        message: 'Ce code promotionnel a été désactivé par l\'administrateur.',
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    const now = new Date();
    const startDate = new Date(promo.starts_at);
    const expireDate = new Date(promo.expires_at);

    if (now < startDate) {
      return {
        valid: false,
        message: `Ce code sera actif à partir du ${startDate.toLocaleDateString('fr-FR')}.`,
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    if (now > expireDate) {
      return {
        valid: false,
        message: `Ce code promotionnel a expiré le ${expireDate.toLocaleDateString('fr-FR')}.`,
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    if (promo.current_uses >= promo.max_uses) {
      return {
        valid: false,
        message: 'La limite maximale d\'utilisations de ce code promo a été atteinte.',
        finalPrice: planPrice,
        discountAmount: 0,
      };
    }

    // Calculate discount
    let discountAmount = planPrice;
    let finalPrice = 0;

    if (promo.discount_type === 'percentage') {
      discountAmount = Math.round((planPrice * promo.discount_value) / 100);
      finalPrice = Math.max(0, planPrice - discountAmount);
    } else if (promo.discount_type === 'fixed_amount') {
      discountAmount = Math.min(planPrice, promo.discount_value);
      finalPrice = Math.max(0, planPrice - discountAmount);
    } else {
      // free_publication
      discountAmount = planPrice;
      finalPrice = 0;
    }

    return {
      valid: true,
      message: `Code promotionnel valide ! Publication gratuite accordée (${discountAmount.toLocaleString('fr-FR')} FCFA offerts).`,
      promo,
      finalPrice,
      discountAmount,
    };
  }

  /**
   * Record the usage of a promo code when listing is published
   */
  static async recordPromoUse(params: {
    promoId: string;
    code: string;
    listingId?: string;
    userPhone?: string;
    discountApplied: number;
  }): Promise<boolean> {
    const allPromos = await this.getAllPromoCodes();
    const targetIdx = allPromos.findIndex((p) => p.id === params.promoId || p.code === params.code);

    if (targetIdx !== -1) {
      allPromos[targetIdx].current_uses += 1;
      this.saveStoredPromos(allPromos);

      try {
        if (supabase) {
          await supabase
            .from('promo_codes')
            .update({ current_uses: allPromos[targetIdx].current_uses })
            .eq('id', allPromos[targetIdx].id);
        }
      } catch {
        // fallback
      }
    }

    const newUse: PromoCodeUse = {
      id: `use_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      promo_code_id: params.promoId,
      code: params.code,
      listing_id: params.listingId,
      user_phone: params.userPhone,
      discount_applied: params.discountApplied,
      used_at: new Date().toISOString(),
    };

    const currentUses = await this.getAllPromoUses();
    const updatedUses = [newUse, ...currentUses];
    this.saveStoredUses(updatedUses);

    try {
      if (supabase) {
        await supabase.from('promo_code_uses').insert(newUse);
      }
    } catch {
      // fallback
    }

    return true;
  }

  /**
   * Toggle promo active status (indépendant de l'annonce d'accueil)
   */
  static async togglePromoStatus(id: string): Promise<boolean> {
    const allPromos = await this.getAllPromoCodes();
    const item = allPromos.find((p) => p.id === id);
    if (!item) return false;

    item.is_active = !item.is_active;
    this.saveStoredPromos(allPromos);

    try {
      if (supabase) {
        await supabase.from('promo_codes').update({ is_active: item.is_active }).eq('id', id);
      }
    } catch {
      // fallback
    }
    return true;
  }

  /**
   * Toggle publication of promo announcement on home page banner
   * INDEPENDENT of promo validity / is_active
   */
  static async toggleBannerPublished(id: string): Promise<boolean> {
    const allPromos = await this.getAllPromoCodes();
    const item = allPromos.find((p) => p.id === id);
    if (!item) return false;

    const nextState = !item.is_banner_published;

    // If publishing this banner, we can unpublish others or keep this as active
    allPromos.forEach((p) => {
      if (p.id === id) {
        p.is_banner_published = nextState;
      } else if (nextState) {
        // Only one active banner announcement at a time for clarity
        p.is_banner_published = false;
      }
    });

    this.saveStoredPromos(allPromos);

    try {
      if (supabase) {
        await supabase
          .from('promo_codes')
          .update({ is_banner_published: nextState })
          .eq('id', id);
      }
    } catch {
      // fallback
    }
    return true;
  }

  /**
   * Retrieve the active promotional banner code for the home page (if published)
   */
  static async getPublishedBannerPromo(): Promise<PromoCode | null> {
    const allPromos = await this.getAllPromoCodes();
    const published = allPromos.find((p) => p.is_banner_published);
    return published || null;
  }

  static async deletePromo(id: string): Promise<boolean> {
    const allPromos = await this.getAllPromoCodes();
    const filtered = allPromos.filter((p) => p.id !== id);
    this.saveStoredPromos(filtered);

    try {
      if (supabase) {
        await supabase.from('promo_codes').delete().eq('id', id);
      }
    } catch {
      // fallback
    }
    return true;
  }
}
