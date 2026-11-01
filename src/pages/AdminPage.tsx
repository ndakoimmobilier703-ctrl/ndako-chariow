import React, { useState, useEffect } from 'react';
import { listingService } from '@/services/listingService';
import { SettingsService } from '@/services/settingsService';
import type {
  Listing,
  ListingStatus,
  PlatformSettings,
  PublicationPlan,
  Transaction,
  AuditLog,
  GeoLocation,
  SiteCustomization,
} from '@/types';
import { NdakoLogo } from '@/components/common/NdakoLogo';
import {
  ShieldCheck,
  Lock,
  LogOut,
  LayoutDashboard,
  Building2,
  DollarSign,
  Receipt,
  Globe2,
  Users,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  Search,
  ExternalLink,
  Ticket,
  MessageSquare,
  MousePointerClick,
  Settings as SettingsIcon,
  UserCheck,
  ArrowRight,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { AdminPromoCodes } from '@/components/admin/AdminPromoCodes';
import { AdminReviews } from '@/components/admin/AdminReviews';
import { AdminVisitors } from '@/components/admin/AdminVisitors';
import { AdminTraceability } from '@/components/admin/AdminTraceability';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

export const AdminPage: React.FC = () => {
  // Supabase Auth + server-side admin membership check.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (active) setIsAuthenticated(false);
        return;
      }
      const { data, error } = await supabase.rpc('is_ndako_admin');
      if (active) setIsAuthenticated(!error && data === true);
      if (error || data !== true) await supabase.auth.signOut();
    };
    void checkSession().catch(() => { if (active) setIsAuthenticated(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setIsAuthenticated(false);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'listings' | 'promos' | 'reviews' | 'visitors' | 'traceability' | 'settings' | 'plans' | 'transactions' | 'geo' | 'advertisers' | 'logs'
  >('dashboard');

  // Data states
  const [settings, setSettings] = useState<PlatformSettings>({
    id: 'default',
    mode_publication: 'paid',
    allow_instant_publish: true,
    allow_homepage_promo_ads: true,
    allow_public_listings: true,
  });
  const [listings, setListings] = useState<Listing[]>([]);
  const [plans, setPlans] = useState<PublicationPlan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [geoLocations, setGeoLocations] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [siteCustomization, setSiteCustomization] = useState<SiteCustomization>(() =>
    SettingsService.getCustomization()
  );

  const handleToggleOrangeBanner = (enabled: boolean) => {
    const updated = { ...siteCustomization, announcement_banner_enabled: enabled };
    setSiteCustomization(updated);
    SettingsService.saveCustomization(updated);
    toast.success(
      enabled
        ? "Barre flash orange activée sur la page d'accueil !"
        : "Barre flash orange désactivée de la page d'accueil !"
    );
  };

  const handleToggleBlueBanner = async (enabled: boolean) => {
    const updated = { ...settings, allow_homepage_promo_ads: enabled };
    try {
      await listingService.updatePlatformSettings({ allow_homepage_promo_ads: enabled });
      setSettings(updated);
    } catch {
      toast.error('Impossible d’enregistrer le réglage de la bannière.');
      return;
    }
    toast.success(
      enabled
        ? "Bannière d'offre promotionnelle bleue activée sur l'accueil !"
        : "Bannière d'offre promotionnelle bleue désactivée de l'accueil !"
    );
  };

  const handleDisableAllAdsFromDashboard = async () => {
    const updatedCustom = { ...siteCustomization, announcement_banner_enabled: false };
    setSiteCustomization(updatedCustom);
    SettingsService.saveCustomization(updatedCustom);

    const updatedSettings = { ...settings, allow_homepage_promo_ads: false };
    try { await listingService.updatePlatformSettings({ allow_homepage_promo_ads: false }); }
    catch { toast.error('Impossible d’enregistrer les réglages.'); return; }
    setSettings(updatedSettings);

    toast.success("Toutes les annonces d'accueil ont été désactivées !");
  };

  const handleEnableAllAdsFromDashboard = async () => {
    const updatedCustom = { ...siteCustomization, announcement_banner_enabled: true };
    setSiteCustomization(updatedCustom);
    SettingsService.saveCustomization(updatedCustom);

    const updatedSettings = { ...settings, allow_homepage_promo_ads: true };
    try { await listingService.updatePlatformSettings({ allow_homepage_promo_ads: true }); }
    catch { toast.error('Impossible d’enregistrer les réglages.'); return; }
    setSettings(updatedSettings);

    toast.success("Toutes les annonces d'accueil ont été réactivées !");
  };

  // Listing filter & modal state
  const [listingStatusFilter, setListingStatusFilter] = useState<ListingStatus | 'all'>('all');
  const [listingSearch, setListingSearch] = useState<string>('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [extendModalOpen, setExtendModalOpen] = useState<boolean>(false);
  const [extendDays, setExtendDays] = useState<string>('14');

  // Plan editing modal
  const [editPlan, setEditPlan] = useState<PublicationPlan | null>(null);
  const [editPlanPrice, setEditPlanPrice] = useState<string>('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [platSettings, allListings, pubPlans, allTxns, logs, geos] = await Promise.all([
        listingService.getPlatformSettings(),
        listingService.getAllListings(),
        listingService.getPublicationPlans(),
        listingService.getTransactions(),
        listingService.getAuditLogs(),
        listingService.getGeoLocations(),
      ]);
      setSettings(platSettings);
      setListings(allListings);
      setPlans(pubPlans);
      setTransactions(allTxns);
      setAuditLogs(logs);
      setGeoLocations(geos);
    } catch {
      toast.error('Erreur lors du chargement des données administratives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
      const { data: isAdmin, error: roleError } = await supabase.rpc('is_ndako_admin');
      if (roleError || isAdmin !== true) {
        await supabase.auth.signOut();
        throw new Error('Ce compte ne possède pas les droits administrateur Ndako.');
      }
      setIsAuthenticated(true);
      setPassword('');
      toast.success('Connexion administrateur réussie !');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    toast.info('Déconnexion effectuée');
  };

  // Toggle Publication Mode
  const handleToggleMode = async (checked: boolean) => {
    const newMode = checked ? 'paid' : 'free';
    try {
      await listingService.setPublicationMode(newMode);
      setSettings((prev) => ({ ...prev, mode_publication: newMode }));
      toast.success(
        newMode === 'paid'
          ? 'Mode Payant activé : Les frais de publication s appliquent désormais.'
          : 'Mode Gratuit activé : Les utilisateurs peuvent publier gratuitement.'
      );
      loadAdminData();
    } catch {
      toast.error('Erreur lors de la modification du mode');
    }
  };

  // Listing Moderation Actions
  const handleUpdateStatus = async (id: string, status: ListingStatus) => {
    try {
      await listingService.updateListingStatus(id, status);
      toast.success(`Statut mis à jour vers : ${status}`);
      loadAdminData();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleExtendDuration = async () => {
    if (!selectedListing) return;
    try {
      await listingService.extendListingDuration(selectedListing.id, parseInt(extendDays, 10));
      toast.success(`Annonce prolongée de ${extendDays} jours avec succès !`);
      setExtendModalOpen(false);
      loadAdminData();
    } catch {
      toast.error('Erreur lors de la prolongation');
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm('Confirmez-vous la suppression définitive de cette annonce ?')) return;
    try {
      await listingService.deleteListing(id);
      toast.success('Annonce supprimée');
      loadAdminData();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Plan Price Save
  const handleSavePlanPrice = async () => {
    if (!editPlan || !editPlanPrice) return;
    try {
      await listingService.updatePlanPrice(editPlan.id, parseInt(editPlanPrice, 10));
      toast.success('Tarif mis à jour !');
      setEditPlan(null);
      loadAdminData();
    } catch {
      toast.error('Erreur lors de la mise à jour du tarif');
    }
  };

  // Compute Dashboard KPIs
  const now = Date.now();
  const totalListings = listings.length;
  const activeListings = listings.filter(
    (l) => l.status === 'active' && new Date(l.expires_at).getTime() > now
  ).length;
  const expiredListings = listings.filter(
    (l) => l.status === 'expired' || new Date(l.expires_at).getTime() <= now
  ).length;
  const suspendedListings = listings.filter((l) => l.status === 'suspended').length;
  const paidListings = listings.filter((l) => l.publication_mode === 'paid').length;
  const freeListings = listings.filter((l) => l.publication_mode === 'free').length;
  const successfulTxns = transactions.filter((t) => t.status === 'success');
  const totalRevenue = successfulTxns.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // Group listings by country for dashboard summary
  const countryCounts = listings.reduce((acc, curr) => {
    acc[curr.country] = (acc[curr.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtered listings
  const filteredListings = listings.filter((l) => {
    const matchesStatus =
      listingStatusFilter === 'all'
        ? true
        : listingStatusFilter === 'expired'
        ? l.status === 'expired' || new Date(l.expires_at).getTime() <= now
        : l.status === listingStatusFilter;

    const matchesSearch =
      listingSearch.trim() === ''
        ? true
        : l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
          l.city.toLowerCase().includes(listingSearch.toLowerCase()) ||
          l.advertiser_name.toLowerCase().includes(listingSearch.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-border shadow-xl space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <NdakoLogo size="lg" clickable={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Se connecter
            </h1>
          </div>

          {loginError ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                disabled={isLoggingIn}
                className="rounded-xl h-11 w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Mot de passe
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                disabled={isLoggingIn}
                className="rounded-xl h-11 w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-11 bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-medium rounded-xl shadow-md transition-all text-sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              <span>{isLoggingIn ? 'Connexion…' : 'Se connecter'}</span>
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 bg-[#0F3E6D] text-white border-b border-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <NdakoLogo size="sm" adminBadge={true} href="/admin" />
            </div>
            <span className="hidden md:inline text-xs text-blue-200">
              | Panneau de contrôle central
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Administrateur Ndako connecté</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:bg-white/10 text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Subheader & Mode Toggle Switch */}
      <div className="bg-white dark:bg-slate-900 border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
              { id: 'listings', label: 'Annonces', icon: Building2 },
              { id: 'promos', label: 'Codes Promo', icon: Ticket },
              { id: 'reviews', label: 'Avis & Modération', icon: MessageSquare },
              { id: 'visitors', label: 'Visiteurs', icon: Users },
              { id: 'traceability', label: 'Traçabilité', icon: MousePointerClick },
              { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
              { id: 'plans', label: 'Tarifs & Durées', icon: DollarSign },
              { id: 'transactions', label: 'Transactions', icon: Receipt },
              { id: 'geo', label: 'Villes & Pays', icon: Globe2 },
              { id: 'advertisers', label: 'Annonceurs', icon: UserCheck },
              { id: 'logs', label: 'Journal d activité', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    activeTab === tab.id
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

          {/* CRITICAL FEATURE: Mode Payant vs Mode Gratuit Switch */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-border shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground">
                Paiements de publication :
              </span>
              <span
                className={`text-xs font-black ${
                  settings.mode_publication === 'paid' ? 'text-[#0F3E6D] dark:text-blue-300' : 'text-emerald-600'
                }`}
              >
                {settings.mode_publication === 'paid' ? 'MODE PAYANT ACTIF' : 'MODE GRATUIT ACTIF'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                {settings.mode_publication === 'paid' ? 'Payant' : 'Gratuit'}
              </span>
              <Switch
                checked={settings.mode_publication === 'paid'}
                onCheckedChange={handleToggleMode}
                className="data-[state=checked]:bg-[#0F3E6D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: TABLEAU DE BORD (DASHBOARD) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Quick Refresh Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Vue d ensemble & Indicateurs</h2>
                <p className="text-xs text-muted-foreground">
                  Statistiques en temps réel sur les annonces, les paiements et l activité globale.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAdminData}
                disabled={loading}
                className="text-xs flex items-center gap-1.5 rounded-xl"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </Button>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase">Total Annonces</span>
                  <Building2 className="w-4 h-4 text-[#0F3E6D]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground">{totalListings}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Dont <strong>{paidListings}</strong> payantes & <strong>{freeListings}</strong> gratuites
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase">Annonces Actives</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">{activeListings}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Visibles par les visiteurs</div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase">Expirées / Suspendues</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-600">
                  {expiredListings + suspendedListings}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {expiredListings} expirées, {suspendedListings} suspendues
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-bold uppercase">Revenus Confirmés</span>
                  <TrendingUp className="w-4 h-4 text-[#F97316]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[#0F3E6D] dark:text-blue-300">
                  {totalRevenue.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Sur <strong>{successfulTxns.length}</strong> transactions réussies
                </div>
              </div>
            </div>

            {/* Quick Banner & Ads Control Center (from Screenshot Requirement) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-border shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3.5">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#F97316]" />
                    <span>Contrôle Direct des Annonces & Bannières d'Accueil</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Désactivez ou réactivez immédiatement les bannières visibles sur la page d'accueil sans quitter le tableau de bord.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDisableAllAdsFromDashboard}
                    className="text-xs font-bold text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                    <span>Tout désactiver (1 clic)</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEnableAllAdsFromDashboard}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>Tout réactiver</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Barre Flash Orange */}
                <div className="p-4 rounded-xl border border-[#F97316]/30 bg-orange-50/50 dark:bg-orange-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                        <span>Barre Flash Orange Supérieure</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          siteCustomization.announcement_banner_enabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {siteCustomization.announcement_banner_enabled ? 'Active' : 'Désactivée'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {siteCustomization.announcement_banner_text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-orange-200/60 dark:border-orange-900/60">
                    <span className="text-[11px] font-semibold text-muted-foreground">Affichage sur le site</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={siteCustomization.announcement_banner_enabled ? 'destructive' : 'default'}
                      onClick={() =>
                        handleToggleOrangeBanner(!siteCustomization.announcement_banner_enabled)
                      }
                      className="text-xs h-7 px-3 rounded-lg font-bold"
                    >
                      {siteCustomization.announcement_banner_enabled ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </div>

                {/* 2. Bannière Bleue Offre Promo */}
                <div className="p-4 rounded-xl border border-[#0F3E6D]/30 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-foreground">
                        <Ticket className="w-3.5 h-3.5 text-[#0F3E6D] dark:text-blue-400" />
                        <span>Bannière Bleue d'Offre Promotionnelle</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          settings.allow_homepage_promo_ads !== false
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {settings.allow_homepage_promo_ads !== false ? 'Active' : 'Désactivée'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Offre spéciale de bienvenue (NDAKO-BIENVENUE / réduction bailleurs)
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                    <span className="text-[11px] font-semibold text-muted-foreground">Affichage sur le site</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={settings.allow_homepage_promo_ads !== false ? 'destructive' : 'default'}
                      onClick={() =>
                        handleToggleBlueBanner(settings.allow_homepage_promo_ads === false)
                      }
                      className="text-xs h-7 px-3 rounded-lg font-bold"
                    >
                      {settings.allow_homepage_promo_ads !== false ? 'Désactiver' : 'Activer'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographical Distribution & Chart Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
                <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-[#0F3E6D]" />
                  <span>Répartition des annonces par pays</span>
                </h3>

                <div className="space-y-3">
                  {(Object.entries(countryCounts) as [string, number][]).map(([cName, count]) => {
                    const percentage = Math.round((count / (totalListings || 1)) * 100);
                    return (
                      <div key={cName} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{cName}</span>
                          <span className="text-muted-foreground">
                            {count} annonces ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-[#0F3E6D] rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Publication Plans Summary */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#F97316]" />
                    <span>Formules de publication en vigueur</span>
                  </h3>
                  <div className="space-y-3">
                    {plans.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-foreground">{p.title}</div>
                          <div className="text-xs text-muted-foreground">{p.duration_days} jours de parution</div>
                        </div>
                        <div className="text-base font-black text-[#0F3E6D] dark:text-blue-300">
                          {p.price_fcfa.toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Modules Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('promos')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border hover:border-amber-400 dark:hover:border-amber-600 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Ticket className="w-4 h-4 text-amber-500" />
                    <span>Codes Promo</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Générer & suivre</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('visitors')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border hover:border-blue-400 dark:hover:border-blue-600 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Users className="w-4 h-4 text-[#0F3E6D] dark:text-blue-400" />
                    <span>Visiteurs</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Fréquentation & Pays</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('traceability')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border hover:border-purple-400 dark:hover:border-purple-600 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <MousePointerClick className="w-4 h-4 text-purple-600" />
                    <span>Traçabilité</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Clics & Parcours</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border hover:border-emerald-400 dark:hover:border-emerald-600 transition-all text-left flex items-center justify-between group shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <SettingsIcon className="w-4 h-4 text-emerald-600" />
                    <span>Paramètres</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Sécurité & Thème</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GESTION DES ANNONCES (LISTINGS) */}
        {activeTab === 'listings' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h2 className="text-xl font-black text-foreground">Gestion des Annonces</h2>
                <p className="text-xs text-muted-foreground">
                  Modération, suspension, prolongation et suppression des offres.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Recherche par titre, ville..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full sm:w-60 h-9 text-xs rounded-xl"
                />
                <Select
                  value={listingStatusFilter}
                  onValueChange={(val: any) => setListingStatusFilter(val)}
                >
                  <SelectTrigger className="w-36 h-9 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="suspended">Suspendues</SelectItem>
                    <SelectItem value="expired">Expirées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Listings Table */}
            <div className="w-full max-w-full overflow-x-auto bg-card rounded-2xl border border-border">
              <table className="w-full text-left text-xs [&>div]:max-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 text-muted-foreground uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Bien & Titre</th>
                    <th className="p-3.5 whitespace-nowrap">Localisation</th>
                    <th className="p-3.5 whitespace-nowrap">Loyer</th>
                    <th className="p-3.5 whitespace-nowrap">Mode</th>
                    <th className="p-3.5 whitespace-nowrap">Statut</th>
                    <th className="p-3.5 whitespace-nowrap">Date d'expiration</th>
                    <th className="p-3.5 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredListings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Aucune annonce ne correspond à votre filtre.
                      </td>
                    </tr>
                  ) : (
                    filteredListings.map((l) => {
                      const isExpired = new Date(l.expires_at).getTime() <= now;
                      return (
                        <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={l.photos?.[0]}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                              />
                              <div>
                                <div className="font-bold text-foreground max-w-xs truncate">
                                  {l.title}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {l.property_type} • Par {l.advertiser_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {l.country}, {l.city} ({l.neighborhood})
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-bold text-foreground">
                            {l.price.toLocaleString('fr-FR')} {l.currency}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                l.publication_mode === 'paid'
                                  ? 'bg-blue-100 text-[#0F3E6D]'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {l.publication_mode === 'paid' ? 'Payante' : 'Gratuite'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                l.status === 'active' && !isExpired
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : l.status === 'suspended'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {isExpired ? 'Expirée' : l.status}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                            {new Date(l.expires_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                            {/* Actions Buttons */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedListing(l);
                                setExtendModalOpen(true);
                              }}
                              title="Prolonger la durée"
                              className="h-8 px-2 text-[#0F3E6D]"
                            >
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              <span>Prolonger</span>
                            </Button>

                            {l.status === 'active' ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(l.id, 'suspended')}
                                className="h-8 px-2 text-amber-600 hover:text-amber-700"
                                title="Suspendre"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(l.id, 'active')}
                                className="h-8 px-2 text-emerald-600 hover:text-emerald-700"
                                title="Réactiver"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteListing(l.id)}
                              className="h-8 px-2 text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TARIFS & FORMULES (PLANS) */}
        {activeTab === 'plans' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Gestion des Tarifs et Formules</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Configurez les prix en FCFA pour chaque durée de publication sur la plateforme Ndako.
              </p>
              <p className="text-xs rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-3 mt-3">
                Synchronisation Chariow obligatoire : après toute modification d’un tarif ici, modifiez également le prix du produit correspondant dans Chariow. Sinon, Ndako bloquera le paiement pour éviter un montant incorrect.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-6 rounded-2xl border-2 border-border bg-slate-50 dark:bg-slate-800/60 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-foreground">{p.title}</h4>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Actif
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Durée d'affichage : {p.duration_days} jours consécutifs
                    </p>
                    <div className="text-3xl font-black text-[#0F3E6D] dark:text-blue-300 pt-2">
                      {p.price_fcfa.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setEditPlan(p);
                      setEditPlanPrice(p.price_fcfa.toString());
                    }}
                    className="w-full bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                    Modifier ce tarif
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TRANSACTIONS (PAIEMENTS) */}
        {activeTab === 'transactions' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground">Historique des Transactions</h2>
                <p className="text-xs text-muted-foreground">
                  Suivi de tous les règlements confirmés via Mobile Money et Carte bancaire.
                </p>
              </div>
              <div className="text-sm font-bold text-[#0F3E6D]">
                Total encaissé : {totalRevenue.toLocaleString('fr-FR')} FCFA
              </div>
            </div>

            <div className="w-full max-w-full overflow-x-auto bg-card rounded-2xl border border-border">
              <table className="w-full text-left text-xs [&>div]:max-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 text-muted-foreground uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Réf. Transaction</th>
                    <th className="p-3.5 whitespace-nowrap">Payeur</th>
                    <th className="p-3.5 whitespace-nowrap">Moyen</th>
                    <th className="p-3.5 whitespace-nowrap">Montant</th>
                    <th className="p-3.5 whitespace-nowrap">Statut</th>
                    <th className="p-3.5 whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Aucune transaction enregistrée pour le moment.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/40">
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-foreground">
                          {tx.reference}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {tx.payer_name || 'Bailleur Ndako'} ({tx.payer_phone || 'N/A'})
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-semibold">
                          {tx.payment_method}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-bold text-[#0F3E6D]">
                          {tx.amount.toLocaleString('fr-FR')} {tx.currency}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: GEO & CATEGORIES */}
        {activeTab === 'geo' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">
                Zones Géographiques & Catégories
              </h2>
              <p className="text-xs text-muted-foreground">
                Pays, villes et quartiers couverts par la plateforme Ndako.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {geoLocations.map((geo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-[#0F3E6D]" />
                      <span>
                        {geo.country} ({geo.city})
                      </span>
                    </h4>
                    <span className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-border">
                      {geo.country_code}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quartiers desservis : {geo.neighborhoods.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ADVERTISERS */}
        {activeTab === 'advertisers' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Annonceurs et Bailleurs</h2>
              <p className="text-xs text-muted-foreground">
                Répertoire des comptes et agences publiant des logements sur Ndako.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-border space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F3E6D] text-white flex items-center justify-center font-bold">
                      {l.advertiser_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{l.advertiser_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {l.city}, {l.country}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 text-xs text-muted-foreground space-y-1">
                    <div>WhatsApp : {l.whatsapp_number}</div>
                    <div>Tél : {l.phone_number}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-xs space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-black text-foreground">Journal d'Activité & Audit</h2>
              <p className="text-xs text-muted-foreground">
                Traçabilité des opérations sensibles effectuées par l'administrateur.
              </p>
            </div>

            <div className="w-full max-w-full overflow-x-auto bg-card rounded-2xl border border-border">
              <table className="w-full text-left text-xs [&>div]:max-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800 text-muted-foreground uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Action</th>
                    <th className="p-3.5 whitespace-nowrap">Détails</th>
                    <th className="p-3.5 whitespace-nowrap">Admin</th>
                    <th className="p-3.5 whitespace-nowrap">Date & Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        Aucun journal enregistré.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/40">
                        <td className="p-3.5 whitespace-nowrap font-bold text-[#0F3E6D]">
                          {log.action}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-foreground">{log.details}</td>
                        <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                          {log.admin_email}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: GESTION DES CODES PROMOTIONNELS (STEP 1) */}
        {activeTab === 'promos' && <AdminPromoCodes />}

        {/* TAB 8.5: AVIS ET MODÉRATION (ÉTAPE 4) */}
        {activeTab === 'reviews' && <AdminReviews />}

        {/* TAB 9: GESTION DES VISITEURS (STEP 2) */}
        {activeTab === 'visitors' && <AdminVisitors />}

        {/* TAB 10: TRAÇABILITÉ DES INTERACTIONS (STEP 3) */}
        {activeTab === 'traceability' && <AdminTraceability />}

        {/* TAB 11: PARAMÈTRES GÉNÉRAUX, PERSONNALISATION & SÉCURITÉ (STEP 4, 5, 6) */}
        {activeTab === 'settings' && (
          <AdminSettings
            platformSettings={settings}
            plans={plans}
            onSettingsUpdated={loadAdminData}
          />
        )}
      </main>

      {/* MODAL: PROLONGER LA DURÉE DE PUBLICATION */}
      <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Prolonger la publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Annonce sélectionnée :{' '}
              <strong className="text-foreground">{selectedListing?.title}</strong>
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nombre de jours à ajouter :</label>
              <Select value={extendDays} onValueChange={setExtendDays}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">+ 7 jours (1 semaine)</SelectItem>
                  <SelectItem value="14">+ 14 jours (2 semaines)</SelectItem>
                  <SelectItem value="30">+ 30 jours (1 mois)</SelectItem>
                  <SelectItem value="60">+ 60 jours (2 mois)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setExtendModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleExtendDuration} className="bg-[#0F3E6D] text-white">
              Confirmer la prolongation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: MODIFIER LE PRIX D'UNE FORMULE */}
      <Dialog open={Boolean(editPlan)} onOpenChange={() => setEditPlan(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le tarif de la formule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Formule : <strong className="text-foreground">{editPlan?.title}</strong> (
              {editPlan?.duration_days} jours)
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nouveau prix (FCFA) :</label>
              <Input
                type="number"
                value={editPlanPrice}
                onChange={(e) => setEditPlanPrice(e.target.value)}
                className="rounded-xl font-bold"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditPlan(null)}>
              Annuler
            </Button>
            <Button onClick={handleSavePlanPrice} className="bg-[#0F3E6D] text-white">
              Enregistrer le nouveau prix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
