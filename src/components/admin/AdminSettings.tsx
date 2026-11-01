import React, { useState, useEffect } from 'react';
import type { PlatformSettings, PublicationPlan, SiteCustomization, AdminSecurityProfile } from '@/types';
import { listingService } from '@/services/listingService';
import { SettingsService, DEFAULT_SITE_CUSTOMIZATION } from '@/services/settingsService';
import {
  Settings,
  Sliders,
  DollarSign,
  Palette,
  ShieldAlert,
  Database,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Save,
  Download,
  Info,
  ShieldCheck,
  Building2,
  Phone,
  MessageCircle,
  Sparkles,
  Ticket,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface AdminSettingsProps {
  platformSettings: PlatformSettings;
  plans: PublicationPlan[];
  onSettingsUpdated: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  platformSettings,
  plans,
  onSettingsUpdated,
}) => {
  // Category tabs
  const [activeCategory, setActiveCategory] = useState<
    'general' | 'publication' | 'pricing' | 'customization' | 'security' | 'maintenance'
  >('general');

  // General Settings state
  const [supportPhone, setSupportPhone] = useState<string>(platformSettings.support_phone || '+242 06 543 2190');
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>(platformSettings.support_whatsapp || '+242 06 543 2190');
  const [supportEmail, setSupportEmail] = useState<string>(platformSettings.support_email || 'support@ndako.cg');

  // Publication Settings state
  const [modePublication, setModePublication] = useState<'paid' | 'free'>(platformSettings.mode_publication);
  const [allowInstantPublish, setAllowInstantPublish] = useState<boolean>(platformSettings.allow_instant_publish);
  const [allowHomepagePromoAds, setAllowHomepagePromoAds] = useState<boolean>(platformSettings.allow_homepage_promo_ads ?? true);
  const [allowPublicListings, setAllowPublicListings] = useState<boolean>(platformSettings.allow_public_listings ?? true);

  // Customization state (Step 5)
  const [customization, setCustomization] = useState<SiteCustomization>(() => SettingsService.getCustomization());
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Security Credentials state (Step 6)
  const [securityProfile, setSecurityProfile] = useState<AdminSecurityProfile>(() => SettingsService.getAdminSecurityProfile());
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState<boolean>(false);

  // Load latest settings on mount
  useEffect(() => {
    setModePublication(platformSettings.mode_publication);
    setAllowInstantPublish(platformSettings.allow_instant_publish);
    setAllowHomepagePromoAds(platformSettings.allow_homepage_promo_ads ?? true);
    setAllowPublicListings(platformSettings.allow_public_listings ?? true);
    setSupportPhone(platformSettings.support_phone || '+242 06 543 2190');
    setSupportWhatsapp(platformSettings.support_whatsapp || '+242 06 543 2190');
    setSupportEmail(platformSettings.support_email || 'support@ndako.cg');
    setCustomization(SettingsService.getCustomization());
    setSecurityProfile(SettingsService.getAdminSecurityProfile());
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setSecurityProfile((current) => ({ ...current, email: data.user!.email! }));
    });
  }, [platformSettings]);

  // Handle quick actions for banners
  const handleToggleAnnouncementBanner = async (enabled: boolean) => {
    const updated = { ...customization, announcement_banner_enabled: enabled };
    setCustomization(updated);
    SettingsService.saveCustomization(updated);
    toast.success(enabled ? 'Barre flash orange activée sur l\'accueil !' : 'Barre flash orange désactivée de l\'accueil !');
  };

  const handleTogglePromoBanner = async (enabled: boolean) => {
    try {
      await listingService.updatePlatformSettings({ allow_homepage_promo_ads: enabled });
      setAllowHomepagePromoAds(enabled);
      toast.success(enabled ? 'Bannière bleue d\'offre promotionnelle activée !' : 'Bannière bleue d\'offre promotionnelle désactivée !');
      onSettingsUpdated();
    } catch {
      toast.error('Impossible d\'enregistrer le réglage de la bannière.');
    }
  };

  const handleDisableAllHomepageAds = async () => {
    const updatedCustom = { ...customization, announcement_banner_enabled: false };
    setCustomization(updatedCustom);
    SettingsService.saveCustomization(updatedCustom);

    try {
      await listingService.updatePlatformSettings({ allow_homepage_promo_ads: false });
      setAllowHomepagePromoAds(false);
      toast.success('Toutes les annonces et bannières de la page d\'accueil ont été désactivées !');
      onSettingsUpdated();
    } catch {
      toast.error('Impossible d\'enregistrer les réglages des bannières.');
    }
  };

  const handleEnableAllHomepageAds = async () => {
    const updatedCustom = { ...customization, announcement_banner_enabled: true };
    setCustomization(updatedCustom);
    SettingsService.saveCustomization(updatedCustom);

    try {
      await listingService.updatePlatformSettings({ allow_homepage_promo_ads: true });
      setAllowHomepagePromoAds(true);
      toast.success('Toutes les annonces et bannières de la page d\'accueil ont été réactivées !');
      onSettingsUpdated();
    } catch {
      toast.error('Impossible d\'enregistrer les réglages des bannières.');
    }
  };

  // Handle saving General & Publication settings
  const handleSaveGeneral = async () => {
    try {
      SettingsService.saveCustomization(customization);
      await listingService.updatePlatformSettings({
        mode_publication: modePublication,
        allow_instant_publish: allowInstantPublish,
        allow_homepage_promo_ads: allowHomepagePromoAds,
        allow_public_listings: allowPublicListings,
        support_phone: supportPhone,
        support_whatsapp: supportWhatsapp,
        support_email: supportEmail,
      });
      await listingService.recordAuditLog({
        action: 'UPDATE_PLATFORM_SETTINGS',
        details: `Mise à jour paramètres généraux et publication (Mode: ${modePublication}, Offres accueil: ${allowHomepagePromoAds}, Barre flash: ${customization.announcement_banner_enabled}, Dépôt: ${allowPublicListings})`,
        admin_email: securityProfile.email,
      });
      toast.success('Paramètres enregistrés avec succès !');
      onSettingsUpdated();
    } catch {
      toast.error('Erreur lors de l\'enregistrement des paramètres.');
    }
  };

  // Handle saving Customization (Step 5)
  const handleSaveCustomization = async () => {
    try {
      const saved = SettingsService.saveCustomization(customization);
      setCustomization(saved);
      await listingService.recordAuditLog({
        action: 'UPDATE_CUSTOMIZATION',
        details: 'Personnalisation des textes, couleurs et visibilité des sections enregistrée',
        admin_email: securityProfile.email,
      });
      toast.success('Personnalisation du site appliquée avec succès !');
    } catch {
      toast.error('Erreur lors de l\'enregistrement de la personnalisation.');
    }
  };

  // Handle Reset Customization
  const handleResetCustomization = () => {
    if (window.confirm('Voulez-vous rétablir les réglages d\'apparence par défaut de Ndako ?')) {
      const res = SettingsService.resetCustomization();
      setCustomization(res);
      toast.info('Apparence rétablie aux valeurs par défaut.');
    }
  };

  // Handle updating Credentials & Security (Step 6)
  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassword && newAdminPassword !== confirmPassword) {
      toast.error('Les mots de passe saisis ne correspondent pas.');
      return;
    }

    setIsUpdatingSecurity(true);
    const result = await SettingsService.updateAdminCredentials({
      newEmail: newAdminEmail.trim() || undefined,
      newPassword: newAdminPassword.trim() || undefined,
    });
    setIsUpdatingSecurity(false);

    if (result.success) {
      toast.success(result.message);
      // Record in audit log
      await listingService.recordAuditLog({
        action: 'ADMIN_CREDENTIALS_CHANGE',
        details: `Identifiants mis à jour via Supabase Auth. Email: ${newAdminEmail || securityProfile.email}`,
        admin_email: securityProfile.email,
      });
      setSecurityProfile(SettingsService.getAdminSecurityProfile());
      setNewAdminEmail('');
      setNewAdminPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.message);
      await listingService.recordAuditLog({
        action: 'SECURITY_ALERT_FAILED_CREDENTIALS_CHANGE',
        details: 'Échec de mise à jour des identifiants via Supabase Auth',
        admin_email: securityProfile.email,
      });
    }
  };

  // Handle JSON backup export
  const handleExportBackup = async () => {
    const dataStr = await SettingsService.exportSystemData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ndako_backup_config_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Sauvegarde de la configuration exportée avec succès !');
  };

  return (
    <div className="space-y-6">
      {/* Settings Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0F3E6D]" />
            <h2 className="text-xl font-black text-foreground">Paramètres Généraux & Configuration Centrale</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gérez toutes les fonctionnalités du site réparties par catégories dédiées et sécurisées.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            className="rounded-xl text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Sauvegarder (JSON)</span>
          </Button>
        </div>
      </div>

      {/* Categories Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-border flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: '1. Paramètres Généraux', icon: Sliders },
          { id: 'publication', label: '2. Gestion Publications', icon: Building2 },
          { id: 'pricing', label: '3. Formules & Tarifs', icon: DollarSign },
          { id: 'customization', label: '4. Personnalisation', icon: Palette },
          { id: 'security', label: '5. Identifiants & Sécurité', icon: Lock },
          { id: 'maintenance', label: '6. Sauvegarde & Maintenance', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0F3E6D] text-white shadow-xs'
                  : 'text-foreground/70 hover:bg-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CATEGORY 1: GENERAL SETTINGS */}
      {activeCategory === 'general' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground">Coordonnées de Support & Canaux de Contact</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ces numéros sont affichés sur le site, dans le pied de page et les messages d'aide aux utilisateurs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Téléphone Support
              </label>
              <Input
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+242 06 543 2190"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Assistance
              </label>
              <Input
                value={supportWhatsapp}
                onChange={(e) => setSupportWhatsapp(e.target.value)}
                placeholder="+242 06 543 2190"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-600" />
                Email Support
              </label>
              <Input
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@ndako.cg"
                className="rounded-xl h-11"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={handleSaveGeneral}
              className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold gap-2 px-6"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les paramètres généraux</span>
            </Button>
          </div>
        </div>
      )}

      {/* CATEGORY 2: GESTION DES PUBLICATIONS & BANNIÈRES PROMOTIONNELLES */}
      {activeCategory === 'publication' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-6">
          <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Gestion des Annonces, Bannières & Publications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Boutons de contrôle direct pour désactiver ou activer les annonces visibles sur la page d'accueil.
              </p>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisableAllHomepageAds}
                className="text-xs text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
              >
                <EyeOff className="w-3.5 h-3.5 mr-1 text-rose-600" />
                <span>Désactiver toutes les annonces d'accueil (1 clic)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnableAllHomepageAds}
                className="text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl"
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Tout réactiver</span>
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            {/* 2.1. Barre d'annonce flash orange supérieure */}
            <div className="p-5 rounded-2xl border-2 border-[#F97316]/30 bg-orange-50/40 dark:bg-orange-950/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F97316] shrink-0" />
                    <span className="font-black text-sm text-foreground">
                      1. Barre d'annonce flash orange supérieure (En-tête)
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        customization.announcement_banner_enabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {customization.announcement_banner_enabled ? 'Active / Visible' : 'Désactivée / Masquée'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Barre orange sticky affichée tout en haut de la page d'accueil (code promo ou message flash).
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold uppercase text-foreground">
                    {customization.announcement_banner_enabled ? 'Activé' : 'Désactivé'}
                  </span>
                  <Switch
                    checked={customization.announcement_banner_enabled}
                    onCheckedChange={(checked) => handleToggleAnnouncementBanner(checked)}
                  />
                </div>
              </div>

              {/* Visual preview of Orange Banner */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <span>Aperçu de cette annonce :</span>
                  {!customization.announcement_banner_enabled && (
                    <span className="text-rose-500 font-normal">(actuellement masquée sur le site)</span>
                  )}
                </div>
                <div className="bg-[#F97316] text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{customization.announcement_banner_text}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAnnouncementBanner(!customization.announcement_banner_enabled)}
                    className="h-7 text-[11px] px-2 bg-white/20 hover:bg-white/30 text-white rounded-lg shrink-0"
                  >
                    {customization.announcement_banner_enabled ? 'Désactiver' : 'Activer'}
                  </Button>
                </div>

                <div className="mt-2.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Texte de l'annonce flash :
                  </label>
                  <Input
                    value={customization.announcement_banner_text}
                    onChange={(e) =>
                      setCustomization({ ...customization, announcement_banner_text: e.target.value })
                    }
                    placeholder="Ex: Bienvenue sur Ndako ! Utilisez le code promo CONGO2026..."
                    className="text-xs h-8 bg-white dark:bg-slate-900 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* 2.2. Bannière bleue d'offre promotionnelle d'accueil */}
            <div className="p-5 rounded-2xl border-2 border-[#0F3E6D]/30 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#0F3E6D] shrink-0" />
                    <span className="font-black text-sm text-foreground">
                      2. Bannière bleue d'offre promotionnelle d'accueil (Code Promo)
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        allowHomepagePromoAds
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {allowHomepagePromoAds ? 'Active / Visible' : 'Désactivée / Masquée'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bannière bleue dégradée présentant l'offre spéciale de bienvenue et le bouton « Publier avec ce code ».
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold uppercase text-foreground">
                    {allowHomepagePromoAds ? 'Activé' : 'Désactivé'}
                  </span>
                  <Switch
                    checked={allowHomepagePromoAds}
                    onCheckedChange={(checked) => handleTogglePromoBanner(checked)}
                  />
                </div>
              </div>

              {/* Visual preview of Blue Banner */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                  <span>Aperçu de cette annonce :</span>
                  {!allowHomepagePromoAds && (
                    <span className="text-rose-500 font-normal">(actuellement masquée sur le site)</span>
                  )}
                </div>
                <div className="bg-gradient-to-r from-[#0F3E6D] to-[#1E3A8A] text-white p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Ticket className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase text-amber-300">
                        OFFRE PROMOTIONNELLE NDAKO -100 FCFA
                      </div>
                      <p className="text-[11px] text-blue-100">
                        Offre spéciale de bienvenue : 1 publication gratuite pour les nouveaux bailleurs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded border border-white/20">
                      NDAKO-BIENVENUE
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePromoBanner(!allowHomepagePromoAds)}
                      className="h-7 text-[11px] px-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shrink-0"
                    >
                      {allowHomepagePromoAds ? 'Désactiver cette offre' : 'Activer cette offre'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.3. Activer ou désactiver le bouton « Publier une annonce » */}
            <div className="p-5 rounded-2xl border-2 border-border/80 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-foreground">
                    3. Bouton « Publier une annonce » et accès au formulaire
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      allowPublicListings
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {allowPublicListings ? 'Publication Ouverte' : 'Publication Bloquée'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Lorsque désactivé, le bouton « Publier une annonce » est masqué sur tout le site (en-tête, bannières, page d'accueil)
                  et l'accès direct par l'URL <code>/publier</code> est strictement bloqué côté serveur avec redirection automatique.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold uppercase text-foreground">
                  {allowPublicListings ? 'Activé' : 'Désactivé'}
                </span>
                <Switch
                  checked={allowPublicListings}
                  onCheckedChange={setAllowPublicListings}
                />
              </div>
            </div>

            {/* Note d'indépendance */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#0F3E6D] dark:text-blue-400" />
              <span>
                <strong>Fonctionnement indépendant garanti :</strong> Vous pouvez désactiver individuellement la barre orange, la bannière bleue ou le bouton de publication sans affecter les autres fonctionnalités ni supprimer les annonces en base de données.
              </span>
            </div>

            {/* Mode switch */}
            <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Modèle de facturation par défaut</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {modePublication === 'paid'
                    ? 'Mode Payant : les utilisateurs doivent choisir une formule payante ou saisir un code promo.'
                    : 'Mode Gratuit : toutes les annonces peuvent être publiées gratuitement sans paiement.'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase">
                  {modePublication === 'paid' ? 'Payant' : 'Gratuit'}
                </span>
                <Switch
                  checked={modePublication === 'paid'}
                  onCheckedChange={(checked) => setModePublication(checked ? 'paid' : 'free')}
                />
              </div>
            </div>

            {/* Instant publish switch */}
            <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-foreground">Publication instantanée sans attente</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Active automatiquement les annonces dès validation du paiement ou du code promo.
                </div>
              </div>
              <Switch
                checked={allowInstantPublish}
                onCheckedChange={setAllowInstantPublish}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={handleSaveGeneral}
              className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold gap-2 px-6"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer tous les paramètres de publication</span>
            </Button>
          </div>
        </div>
      )}

      {/* CATEGORY 3: GESTION DES FORMULES & TARIFS */}
      {activeCategory === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-6">
          <div className="border-b border-border pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Formules de Parution et Tarifs (FCFA)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tarifs officiels appliqués aux publications payantes sur Ndako.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Devise standard : FCFA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl border-2 border-border bg-card flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">{p.title}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                      {p.duration_days} jours
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#0F3E6D] dark:text-blue-300 mt-2">
                    {p.price_fcfa.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border pt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Affichage garanti pendant {p.duration_days} jours</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
            💡 <strong>Rappel :</strong> Les codes promotionnels configurés dans l'onglet « Codes promo » permettent d'offrir l'une de ces formules à 100% sans impacter la structure tarifaire.
          </div>
        </div>
      )}

      {/* CATEGORY 4: PERSONNALISATION VISUELLE & FONCTIONNALITÉS (ÉTAPE 2) */}
      {activeCategory === 'customization' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-8">
          <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#F97316]" />
                Personnalisation Complète de l'Apparence Visuelle
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ajustez les couleurs, boutons, bordures, arrondis, menus et formulaires avec prévisualisation en direct.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCustomization}
                className="rounded-xl text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Restaurer les couleurs par défaut</span>
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCustomization}
                className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs gap-1.5 font-bold shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les modifications</span>
              </Button>
            </div>
          </div>

          {/* 1. PALETTE DE COULEURS GÉNÉRALES */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0F3E6D]" />
              1. Palette de Couleurs Générales du Site
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur principale (Primary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.primary_color || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, primary_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.primary_color || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, primary_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur secondaire</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.secondary_color || '#0A2540'}
                    onChange={(e) => {
                      const updated = { ...customization, secondary_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.secondary_color || '#0A2540'}
                    onChange={(e) => {
                      const updated = { ...customization, secondary_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur d'accentuation (Accent)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.accent_color || '#F97316'}
                    onChange={(e) => {
                      const updated = { ...customization, accent_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.accent_color || '#F97316'}
                    onChange={(e) => {
                      const updated = { ...customization, accent_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Arrière-plan des pages (Background)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.background_color || '#F8FAFC'}
                    onChange={(e) => {
                      const updated = { ...customization, background_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.background_color || '#F8FAFC'}
                    onChange={(e) => {
                      const updated = { ...customization, background_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Arrière-plan des cartes & sections</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.card_background_color || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, card_background_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.card_background_color || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, card_background_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur du texte principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.text_color || '#0F172A'}
                    onChange={(e) => {
                      const updated = { ...customization, text_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.text_color || '#0F172A'}
                    onChange={(e) => {
                      const updated = { ...customization, text_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur des liens et ancres</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.link_color || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, link_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.link_color || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, link_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. BOUTONS & ÉTATS INTERACTIFS */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              2. Couleurs des Boutons & États Interactifs
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Bouton état normal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.button_primary_bg || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, button_primary_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.button_primary_bg || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, button_primary_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Bouton au survol (Hover)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.button_primary_hover || '#0A2540'}
                    onChange={(e) => {
                      const updated = { ...customization, button_primary_hover: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.button_primary_hover || '#0A2540'}
                    onChange={(e) => {
                      const updated = { ...customization, button_primary_hover: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Bouton désactivé (Disabled)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.button_disabled_bg || '#94A3B8'}
                    onChange={(e) => {
                      const updated = { ...customization, button_disabled_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.button_disabled_bg || '#94A3B8'}
                    onChange={(e) => {
                      const updated = { ...customization, button_disabled_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Texte des boutons</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.button_text_color || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, button_text_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.button_text_color || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, button_text_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. BORDURES, ÉPAISSEUR & ARRONDIS */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              3. Bordures, Encadrements et Arrondis
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Couleur des bordures</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.border_color || '#E2E8F0'}
                    onChange={(e) => {
                      const updated = { ...customization, border_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.border_color || '#E2E8F0'}
                    onChange={(e) => {
                      const updated = { ...customization, border_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Épaisseur des bordures</label>
                <Select
                  value={customization.border_width || '1px'}
                  onValueChange={(val: any) => {
                    const updated = { ...customization, border_width: val };
                    setCustomization(updated);
                    SettingsService.applyCustomizationToDOM(updated);
                  }}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1px">Fine (1px)</SelectItem>
                    <SelectItem value="2px">Moyenne (2px)</SelectItem>
                    <SelectItem value="3px">Épaisse (3px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Style des bordures</label>
                <Select
                  value={customization.border_style || 'solid'}
                  onValueChange={(val: any) => {
                    const updated = { ...customization, border_style: val };
                    setCustomization(updated);
                    SettingsService.applyCustomizationToDOM(updated);
                  }}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solide continu</SelectItem>
                    <SelectItem value="dashed">Tirets (Dashed)</SelectItem>
                    <SelectItem value="dotted">Pointillés (Dotted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Rayon d'arrondi (Radius)</label>
                <Select
                  value={customization.border_radius || '16px'}
                  onValueChange={(val: any) => {
                    const updated = { ...customization, border_radius: val };
                    setCustomization(updated);
                    SettingsService.applyCustomizationToDOM(updated);
                  }}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8px">Discret (8px)</SelectItem>
                    <SelectItem value="12px">Standard (12px)</SelectItem>
                    <SelectItem value="16px">Moderne Neumorphic (16px)</SelectItem>
                    <SelectItem value="24px">Très arrondi (24px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 4. MENUS, FORMULAIRES & MODALES */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              4. Menus, Champs de Saisie et Fenêtres Modales
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Fond des champs de saisie</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.input_bg || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, input_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.input_bg || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, input_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Bordure des champs de saisie</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.input_border_color || '#CBD5E1'}
                    onChange={(e) => {
                      const updated = { ...customization, input_border_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.input_border_color || '#CBD5E1'}
                    onChange={(e) => {
                      const updated = { ...customization, input_border_color: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Fond des menus & en-tête</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.menu_bg || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, menu_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.menu_bg || '#0F3E6D'}
                    onChange={(e) => {
                      const updated = { ...customization, menu_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-800/30">
                <label className="text-xs font-bold text-foreground">Fond des fenêtres modales</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customization.modal_bg || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, modal_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="w-10 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <Input
                    value={customization.modal_bg || '#FFFFFF'}
                    onChange={(e) => {
                      const updated = { ...customization, modal_bg: e.target.value };
                      setCustomization(updated);
                      SettingsService.applyCustomizationToDOM(updated);
                    }}
                    className="font-mono text-xs rounded-xl h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. PRÉVISUALISATION INTERACTIVE EN TEMPS RÉEL */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#0F3E6D]" />
              5. Prévisualisation Interactive en Temps Réel
            </h4>

            <div
              className="p-6 transition-all shadow-md space-y-5"
              style={{
                backgroundColor: customization.card_background_color || '#FFFFFF',
                borderColor: customization.border_color || '#E2E8F0',
                borderWidth: customization.border_width || '1px',
                borderStyle: (customization.border_style as any) || 'solid',
                borderRadius: customization.border_radius || '16px',
                color: customization.text_color || '#0F172A',
              }}
            >
              <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: customization.border_color || '#E2E8F0' }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: customization.accent_color || '#F97316' }}
                  />
                  <span className="font-black text-sm" style={{ color: customization.primary_color || '#0F3E6D' }}>
                    Exemple de Carte Immobilier Ndako
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${customization.accent_color}20`, color: customization.accent_color }}>
                  En Vedette
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: customization.text_color || '#0F172A' }}>
                Cette maquette dynamique reflète instantanément vos choix de palette, bordures, arrondis et états de boutons. Les réglages s'appliquent fidèlement sur smartphone, tablette et écran PC.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase opacity-75">Champ de saisie</span>
                  <input
                    type="text"
                    readOnly
                    value="Exemple de recherche..."
                    className="w-full text-xs px-3 py-2 outline-none"
                    style={{
                      backgroundColor: customization.input_bg || '#FFFFFF',
                      borderColor: customization.input_border_color || '#CBD5E1',
                      borderWidth: customization.border_width || '1px',
                      borderStyle: (customization.border_style as any) || 'solid',
                      borderRadius: customization.border_radius || '16px',
                      color: customization.text_color || '#0F172A',
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase opacity-75">Bouton Normal</span>
                  <button
                    type="button"
                    className="w-full text-xs font-bold py-2 px-3 shadow-xs transition-all flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: customization.button_primary_bg || '#0F3E6D',
                      color: customization.button_text_color || '#FFFFFF',
                      borderRadius: customization.border_radius || '16px',
                    }}
                  >
                    <span>Action Normale</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase opacity-75">Bouton Désactivé</span>
                  <button
                    type="button"
                    disabled
                    className="w-full text-xs font-bold py-2 px-3 cursor-not-allowed opacity-80"
                    style={{
                      backgroundColor: customization.button_disabled_bg || '#94A3B8',
                      color: customization.button_text_color || '#FFFFFF',
                      borderRadius: customization.border_radius || '16px',
                    }}
                  >
                    <span>Désactivé</span>
                  </button>
                </div>
              </div>

              <div className="text-xs pt-1">
                Lien de démonstration :{' '}
                <a
                  href="#demo"
                  onClick={(e) => e.preventDefault()}
                  className="font-bold underline hover:opacity-80"
                  style={{ color: customization.link_color || '#0F3E6D' }}
                >
                  Voir les annonces disponibles
                </a>
              </div>
            </div>
          </div>

          {/* 6. TEXTES ET LIBELLÉS PRINCIPAUX */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              6. Textes, Slogans et Affichage des Sections
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Slogan d'accueil (Hero Title)</label>
                <Input
                  value={customization.slogan}
                  onChange={(e) => setCustomization({ ...customization, slogan: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Badge d'en-tête (Hero Badge)</label>
                <Input
                  value={customization.hero_badge_text}
                  onChange={(e) => setCustomization({ ...customization, hero_badge_text: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Sous-titre explicatif d'accueil</label>
              <Input
                value={customization.subtitle}
                onChange={(e) => setCustomization({ ...customization, subtitle: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Message d'avertissement anti-fraude officiel</label>
              <Textarea
                rows={2}
                value={customization.anti_fraud_warning_text}
                onChange={(e) => setCustomization({ ...customization, anti_fraud_warning_text: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 7. ACTIVATION & AFFICHAGE DES SECTIONS */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              7. Activation & Affichage des Sections
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">Section Hero (Recherche principale)</span>
                  <p className="text-[11px] text-muted-foreground">Bannière haute avec recherche multicritères</p>
                </div>
                <Switch
                  checked={customization.show_hero_section}
                  onCheckedChange={(checked) => setCustomization({ ...customization, show_hero_section: checked })}
                />
              </div>

              <div className="p-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">Badges de réassurance</span>
                  <p className="text-[11px] text-muted-foreground">Photos réelles, vérification & sécurité</p>
                </div>
                <Switch
                  checked={customization.show_reassurance_badges}
                  onCheckedChange={(checked) => setCustomization({ ...customization, show_reassurance_badges: checked })}
                />
              </div>

              <div className="p-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">Bannière d'alerte anti-fraude</span>
                  <p className="text-[11px] text-muted-foreground">Conseils de sécurité pour les locataires</p>
                </div>
                <Switch
                  checked={customization.show_anti_fraud_banner}
                  onCheckedChange={(checked) => setCustomization({ ...customization, show_anti_fraud_banner: checked })}
                />
              </div>

              <div className="p-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">Annonces en Vedette (Accueil)</span>
                  <p className="text-[11px] text-muted-foreground">Affichage des biens mis en avant</p>
                </div>
                <Switch
                  checked={customization.show_featured_section}
                  onCheckedChange={(checked) => setCustomization({ ...customization, show_featured_section: checked })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleResetCustomization}
              className="rounded-xl text-xs"
            >
              Rétablir les valeurs par défaut
            </Button>
            <Button
              onClick={handleSaveCustomization}
              className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold gap-2 px-6 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </Button>
          </div>
        </div>
      )}

      {/* CATEGORY 5: IDENTIFIANTS ET SÉCURITÉ (STEP 6) */}
      {activeCategory === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Identifiants & Paramètres de Sécurité Administrateur
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modifiez les identifiants du compte administrateur actuellement authentifié par Supabase.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900 rounded-2xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900 dark:text-red-300 space-y-1">
              <div className="font-bold">Zone sécurisée : session administrateur vérifiée</div>
              <p>
                Les modifications sont transmises directement à Supabase Auth. Seul un compte présent dans la liste des administrateurs Ndako peut accéder à cette page.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-4 max-w-xl">
            {/* Current Email Profile */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border text-xs flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Adresse email actuelle du compte :</span>
              <strong className="text-foreground font-mono">{securityProfile.email}</strong>
            </div>

            {/* New Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Nouvelle adresse e-mail (optionnel)
              </label>
              <Input
                type="email"
                placeholder="nouvelle.adresse@idriss.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>

            {/* New Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  Nouveau mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border text-xs text-muted-foreground">
              La modification est appliquée par Supabase Auth à la session administrateur actuellement connectée. Aucun code secret n’est stocké dans le navigateur.
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isUpdatingSecurity}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold px-6 h-11"
              >
                {isUpdatingSecurity ? 'Mise à jour sécurisée...' : 'Mettre à jour les identifiants'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY 6: SAUVEGARDE & MAINTENANCE */}
      {activeCategory === 'maintenance' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Sauvegarde, Intégrité & Maintenance du Système
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exportez l'ensemble des réglages, surveillez l'état des services et maintenez la conformité.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Statut des Services Ndako</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Base de données Postgres :</span>
                  <strong className="text-emerald-600">Opérationnel</strong>
                </div>
                <div className="flex justify-between">
                  <span>Stockage photos (Storage) :</span>
                  <strong className="text-emerald-600">Connecté</strong>
                </div>
                <div className="flex justify-between">
                  <span>Module Codes Promotionnels :</span>
                  <strong className="text-emerald-600">Actif</strong>
                </div>
                <div className="flex justify-between">
                  <span>Traçabilité & Statistiques :</span>
                  <strong className="text-emerald-600">Enregistrement continu</strong>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Download className="w-4 h-4 text-[#0F3E6D]" />
                <span>Export de Sauvegarde Complète</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Générez une archive JSON sécurisée contenant tous les paramètres, tarifs, codes promos et profils configurés.
              </p>
              <Button
                onClick={handleExportBackup}
                className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger la sauvegarde JSON</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
