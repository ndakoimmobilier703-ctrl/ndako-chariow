import { supabase } from '@/db/supabase';
import type { SiteCustomization, AdminSecurityProfile } from '@/types';

const STORAGE_KEY_CUSTOMIZATION = 'ndako_site_customization_v1';
const STORAGE_KEY_ADMIN_SECURITY = 'ndako_admin_security_v1';

// Initial default site customization configuration
export const DEFAULT_SITE_CUSTOMIZATION: SiteCustomization = {
  site_title: 'Ndako',
  slogan: 'Trouvez votre prochain logement en toute sérénité',
  subtitle: 'Plateforme immobilière de référence au Congo, Côte d\'Ivoire, Sénégal, Cameroun et Bénin.',
  hero_badge_text: 'Location immobilière sécurisée en Afrique',
  anti_fraud_warning_text: 'Ne versez JAMAIS d\'argent (caution, frais de visite, réservation) avant d\'avoir physiquement visité le logement !',
  
  // Theme & Colors
  primary_color: '#0F3E6D',
  secondary_color: '#0A2540',
  accent_color: '#F97316',
  background_color: '#F8FAFC',
  card_background_color: '#FFFFFF',
  text_color: '#0F172A',
  link_color: '#0F3E6D',

  // Buttons
  button_primary_bg: '#0F3E6D',
  button_primary_hover: '#0A2540',
  button_disabled_bg: '#94A3B8',
  button_text_color: '#FFFFFF',

  // Borders & Radii
  border_color: '#E2E8F0',
  border_width: '1px',
  border_style: 'solid',
  border_radius: '16px',

  // Inputs, Modals & Menus
  input_bg: '#FFFFFF',
  input_border_color: '#CBD5E1',
  modal_bg: '#FFFFFF',
  menu_bg: '#FFFFFF',

  // Section Visibilities
  show_hero_section: true,
  show_reassurance_badges: true,
  show_anti_fraud_banner: true,
  show_featured_section: true,
  show_cta_publish_banner: true,
  announcement_banner_enabled: true,
  announcement_banner_text: 'Bienvenue sur Ndako ! Utilisez le code promo CONGO2026 pour publier votre annonce gratuitement.',
  announcement_banner_type: 'info',
};

// Initial admin security settings
const DEFAULT_SECURITY_PROFILE: AdminSecurityProfile = {
  email: '',
  last_password_change: new Date(Date.now() - 5 * 86400000).toISOString(),
  last_security_check: new Date().toISOString(),
  session_timeout_minutes: 120,
  two_factor_recommended: true,
};

export class SettingsService {
  /**
   * Get current customization settings
   */
  static getCustomization(): SiteCustomization {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOMIZATION);
      if (stored) {
        return { ...DEFAULT_SITE_CUSTOMIZATION, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SITE_CUSTOMIZATION;
  }

  /**
   * Apply customization dynamically to the DOM
   */
  static applyCustomizationToDOM(customization?: SiteCustomization): void {
    if (typeof document === 'undefined') return;
    const c = customization || this.getCustomization();

    let styleEl = document.getElementById('ndako-custom-appearance-theme') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ndako-custom-appearance-theme';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --ndako-primary: ${c.primary_color || '#0F3E6D'};
        --ndako-secondary: ${c.secondary_color || '#0A2540'};
        --ndako-accent: ${c.accent_color || '#F97316'};
        --ndako-bg: ${c.background_color || '#F8FAFC'};
        --ndako-card-bg: ${c.card_background_color || '#FFFFFF'};
        --ndako-text: ${c.text_color || '#0F172A'};
        --ndako-link: ${c.link_color || '#0F3E6D'};
        --ndako-btn-bg: ${c.button_primary_bg || '#0F3E6D'};
        --ndako-btn-hover: ${c.button_primary_hover || '#0A2540'};
        --ndako-btn-disabled: ${c.button_disabled_bg || '#94A3B8'};
        --ndako-btn-text: ${c.button_text_color || '#FFFFFF'};
        --ndako-border: ${c.border_color || '#E2E8F0'};
        --ndako-border-w: ${c.border_width || '1px'};
        --ndako-border-s: ${c.border_style || 'solid'};
        --ndako-radius: ${c.border_radius || '16px'};
        --ndako-input-bg: ${c.input_bg || '#FFFFFF'};
        --ndako-input-border: ${c.input_border_color || '#CBD5E1'};
        --ndako-modal-bg: ${c.modal_bg || '#FFFFFF'};
        --ndako-menu-bg: ${c.menu_bg || '#FFFFFF'};
      }

      /* Dynamic application on key components without breaking responsiveness */
      body {
        background-color: var(--ndako-bg) !important;
        color: var(--ndako-text) !important;
      }
      a:not(.btn-no-custom) {
        color: var(--ndako-link);
      }
      .bg-[#0F3E6D], .bg-primary {
        background-color: var(--ndako-primary) !important;
      }
      .hover\\:bg-[#0A2540]:hover, .hover\\:bg-primary\\/90:hover {
        background-color: var(--ndako-btn-hover) !important;
      }
      .text-[#0F3E6D] {
        color: var(--ndako-primary) !important;
      }
      .bg-[#F97316], .bg-accent {
        background-color: var(--ndako-accent) !important;
      }
      .text-[#F97316] {
        color: var(--ndako-accent) !important;
      }
    `;
  }

  /**
   * Save customization settings
   */
  static saveCustomization(customization: Partial<SiteCustomization>): SiteCustomization {
    const current = this.getCustomization();
    const updated = { ...current, ...customization };
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(updated));
      this.applyCustomizationToDOM(updated);
    } catch {
      // ignore
    }
    return updated;
  }

  /**
   * Reset customization to factory defaults
   */
  static resetCustomization(): SiteCustomization {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(DEFAULT_SITE_CUSTOMIZATION));
      this.applyCustomizationToDOM(DEFAULT_SITE_CUSTOMIZATION);
    } catch {
      // ignore
    }
    return DEFAULT_SITE_CUSTOMIZATION;
  }

  /**
   * Get admin security profile
   */
  static getAdminSecurityProfile(): AdminSecurityProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ADMIN_SECURITY);
      if (stored) {
        return { ...DEFAULT_SECURITY_PROFILE, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SECURITY_PROFILE;
  }

  /**
   * Update credentials for the currently authenticated Supabase administrator.
   * Authentication is handled by Supabase Auth; credentials are never stored in localStorage.
   */
  static async updateAdminCredentials(params: {
    newEmail?: string;
    newPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    if (!params.newEmail && !params.newPassword) {
      return { success: false, message: 'Veuillez renseigner une nouvelle adresse email ou un nouveau mot de passe.' };
    }
    const attributes: { email?: string; password?: string } = {};
    if (params.newEmail) attributes.email = params.newEmail.trim().toLowerCase();
    if (params.newPassword) attributes.password = params.newPassword;
    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) return { success: false, message: error.message };

    const currentProfile = this.getAdminSecurityProfile();
    const updatedProfile: AdminSecurityProfile = {
      ...currentProfile,
      email: data.user?.email || currentProfile.email,
      last_password_change: params.newPassword ? new Date().toISOString() : currentProfile.last_password_change,
      last_security_check: new Date().toISOString(),
    };
    try { localStorage.setItem(STORAGE_KEY_ADMIN_SECURITY, JSON.stringify(updatedProfile)); } catch { /* optional local display cache */ }
    return {
      success: true,
      message: params.newEmail && params.newPassword
        ? 'Identifiants mis à jour. Confirmez le nouvel email si Supabase vous le demande.'
        : params.newEmail
        ? 'Adresse email mise à jour. Confirmez-la si Supabase vous le demande.'
        : 'Mot de passe mis à jour avec succès.',
    };
  }

  /**
   * Export all system data as JSON (Maintenance & Backup)
   */
  static async exportSystemData(): Promise<string> {
    const data = {
      version: '1.2.0',
      exported_at: new Date().toISOString(),
      customization: this.getCustomization(),
      security_profile: {
        email: this.getAdminSecurityProfile().email,
        last_check: this.getAdminSecurityProfile().last_security_check,
      },
    };
    return JSON.stringify(data, null, 2);
  }
}
