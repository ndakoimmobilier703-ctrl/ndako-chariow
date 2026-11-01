import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listingService';
import { SettingsService } from '@/services/settingsService';
import { PromoCodeService } from '@/services/promoCodeService';
import type { Listing, SiteCustomization, PromoCode, PlatformSettings } from '@/types';
import { ListingCard } from '@/components/common/ListingCard';
import {
  Search,
  Globe2,
  ShieldCheck,
  Zap,
  Home,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Ticket,
  Copy,
  Check,
  X,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

const HERO_CAROUSEL_IMAGES = [
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3db4fbe5-612c-49b5-8b96-6768eced7e49.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_778404a0-9eda-46f3-a7e5-5284af6644de.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_597e44c5-1c53-417f-9123-cd9597302290.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0d0af3d4-72be-4dda-9efd-2020ebcd456a.jpg',
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [customization, setCustomization] = useState<SiteCustomization>(() => SettingsService.getCustomization());
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [publishedPromo, setPublishedPromo] = useState<PromoCode | null>(null);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [dismissAnnouncement, setDismissAnnouncement] = useState<boolean>(false);
  const [dismissPromoBanner, setDismissPromoBanner] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (active) setIsAdminLoggedIn(false); return; }
      const { data, error } = await supabase.rpc('is_ndako_admin');
      if (active) setIsAdminLoggedIn(!error && data === true);
    };
    void checkAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void checkAdmin(); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const handleAdminDisableAnnouncement = () => {
    const updated = { ...customization, announcement_banner_enabled: false };
    setCustomization(updated);
    SettingsService.saveCustomization(updated);
    toast.success("Barre d'annonce flash orange désactivée par l'administrateur !");
  };

  const handleAdminDisablePromoBanner = async () => {
    if (!platformSettings) return;
    const updated = { ...platformSettings, allow_homepage_promo_ads: false };
    try { await listingService.updatePlatformSettings({ allow_homepage_promo_ads: false }); }
    catch { toast.error('Impossible d’enregistrer le réglage.'); return; }
    setPlatformSettings(updated);
    toast.success("Bannière d'offre promotionnelle désactivée par l'administrateur !");
  };

  // Background carousel auto-slide effect (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_CAROUSEL_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch settings & published promo banner
  useEffect(() => {
    listingService.getPlatformSettings().then(setPlatformSettings);
    const fetchPromoBanner = async () => {
      const bannerPromo = await PromoCodeService.getPublishedBannerPromo();
      setPublishedPromo(bannerPromo);
    };
    fetchPromoBanner();
  }, []);

  const handleCopyPromo = () => {
    if (!publishedPromo) return;
    navigator.clipboard.writeText(publishedPromo.code);
    setCopiedPromo(true);
    toast.success(`Code promo ${publishedPromo.code} copié !`);
    setTimeout(() => setCopiedPromo(false), 2500);
  };

  // Search form states
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<string>('all');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const data = await listingService.getActiveListings();
        setFeaturedListings(data.slice(0, 8));
      } catch {
        // Handled in service fallback
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCountry && selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (maxPrice && maxPrice !== 'all') params.set('maxPrice', maxPrice);
    navigate(`/annonces?${params.toString()}`);
  };

  const propertyCategories = [
    {
      title: 'Maisons',
      type: 'Maison',
      count: '1 250+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_778404a0-9eda-46f3-a7e5-5284af6644de.jpg',
    },
    {
      title: 'Appartements',
      type: 'Appartement',
      count: '2 150+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3db4fbe5-612c-49b5-8b96-6768eced7e49.jpg',
    },
    {
      title: 'Studios',
      type: 'Studio',
      count: '980+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_597e44c5-1c53-417f-9123-cd9597302290.jpg',
    },
    {
      title: 'Bureaux',
      type: 'Bureau',
      count: '670+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e4846bc-bf59-4c58-830b-96419873db4a.jpg',
    },
    {
      title: 'Villas',
      type: 'Villa',
      count: '420+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
    },
    {
      title: 'Autres',
      type: 'Autre',
      count: '320+ annonces',
      image: 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_639efd4a-4b91-48f6-903e-baecd5cf4d60.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* FLASH ANNOUNCEMENT BANNER */}
      {customization.announcement_banner_enabled && !dismissAnnouncement && (
        <div className="bg-[#F97316] text-white text-xs font-bold py-2.5 px-4 sticky top-0 z-40 shadow-xs flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center justify-center gap-2 text-center truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{customization.announcement_banner_text}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={handleAdminDisableAnnouncement}
                title="Désactiver cette annonce de la page d'accueil (Accès Admin)"
                className="text-[10px] bg-black/25 hover:bg-black/40 text-white px-2 py-0.5 rounded border border-white/30 flex items-center gap-1 transition-colors"
              >
                <EyeOff className="w-3 h-3" />
                <span className="hidden sm:inline">Désactiver (Admin)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDismissAnnouncement(true)}
              title="Fermer cette annonce"
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DÉCOUPLAGE CODE PROMO: BANNIÈRE PROMOTIONNELLE D'ACCUEIL CONDITIONNÉE PAR L'ADMIN */}
      {platformSettings?.allow_homepage_promo_ads !== false && publishedPromo && !dismissPromoBanner && (
        <div className="bg-gradient-to-r from-[#0F3E6D] to-[#1E3A8A] text-white py-3 px-4 border-b border-blue-900 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Offre Promotionnelle Ndako
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    {publishedPromo.discount_type === 'percentage' && publishedPromo.discount_value === 100
                      ? 'Publication 100% Gratuite'
                      : publishedPromo.discount_type === 'percentage'
                      ? `-${publishedPromo.discount_value}% de réduction`
                      : `-${publishedPromo.discount_value} FCFA`}
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">{publishedPromo.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/10 rounded-xl px-3 py-1.5 border border-white/20">
                <span className="font-mono font-black text-amber-300 text-sm tracking-wider mr-2">
                  {publishedPromo.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPromo}
                  title="Copier le code"
                  className="text-white hover:text-amber-300 transition-colors p-1"
                >
                  {copiedPromo ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Link to={`/publier?promo=${publishedPromo.code}`}>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs h-9 px-4 shadow-sm"
                >
                  <span>Publier avec ce code</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>

              {isAdminLoggedIn && (
                <button
                  type="button"
                  onClick={handleAdminDisablePromoBanner}
                  title="Désactiver cette offre de la page d'accueil (Accès Admin)"
                  className="text-[10px] bg-white/15 hover:bg-white/25 text-white px-2 py-1.5 rounded-lg border border-white/30 flex items-center gap-1 transition-colors ml-1"
                >
                  <EyeOff className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Désactiver (Admin)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDismissPromoBanner(true)}
                title="Fermer cette offre"
                className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION WITH SEARCH BAR */}
      <section className="relative w-full pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
        {/* Background Carousel with smooth automatic sliding */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {HERO_CAROUSEL_IMAGES.map((imgSrc, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentBgIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
              style={{ transitionProperty: 'opacity, transform', transitionDuration: '1200ms' }}
            >
              <img
                src={imgSrc}
                alt="Ndako Immobilier"
                className="w-full h-full object-cover object-center filter brightness-[0.45]"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = HERO_CAROUSEL_IMAGES[0];
                }}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F3E6D]/85 via-[#0A2540]/75 to-[#0A2540]/95" />

          {/* Carousel indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
            {HERO_CAROUSEL_IMAGES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentBgIndex(dotIdx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  dotIdx === currentBgIndex ? 'w-6 bg-[#F97316]' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={`Image ${dotIdx + 1}`}
                aria-label={`Aller à l image ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-semibold mb-4 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{customization.hero_badge_text || 'Location de maisons & appartements partout dans le monde'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-4 text-balance">
              {customization.slogan || (
                <>
                  Trouvez votre logement idéal <br className="hidden sm:inline" />
                  <span className="text-amber-400">où que vous soyez</span> dans le monde
                </>
              )}
            </h1>

            <p className="text-base sm:text-xl text-slate-200 font-normal leading-relaxed text-pretty">
              {customization.subtitle || 'Maisons, appartements, studios, villas et plus encore disponibles à la location dans plusieurs pays en Afrique et à l\'international.'}
            </p>
          </div>

          {/* Search Box Card */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/40 text-foreground">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
              {/* Country Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-[#0F3E6D]" /> Pays
                </label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-border rounded-xl font-medium">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    <SelectItem value="Congo">🇨🇬 Congo</SelectItem>
                    <SelectItem value="Cote d'Ivoire">🇨🇮 Côte d'Ivoire</SelectItem>
                    <SelectItem value="Senegal">🇸🇳 Sénégal</SelectItem>
                    <SelectItem value="Cameroun">🇨🇲 Cameroun</SelectItem>
                    <SelectItem value="Benin">🇧🇯 Bénin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#0F3E6D]" /> Ville
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-border rounded-xl font-medium">
                    <SelectValue placeholder="Toutes les villes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les villes</SelectItem>
                    <SelectItem value="Brazzaville">Brazzaville</SelectItem>
                    <SelectItem value="Pointe-Noire">Pointe-Noire</SelectItem>
                    <SelectItem value="Abidjan">Abidjan</SelectItem>
                    <SelectItem value="Dakar">Dakar</SelectItem>
                    <SelectItem value="Yaoundé">Yaoundé</SelectItem>
                    <SelectItem value="Douala">Douala</SelectItem>
                    <SelectItem value="Cotonou">Cotonou</SelectItem>
                    <SelectItem value="Porto-Novo">Porto-Novo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-[#0F3E6D]" /> Type de bien
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-border rounded-xl font-medium">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="Maison">Maison</SelectItem>
                    <SelectItem value="Appartement">Appartement</SelectItem>
                    <SelectItem value="Studio">Studio</SelectItem>
                    <SelectItem value="Bureau">Bureau</SelectItem>
                    <SelectItem value="Villa">Villa</SelectItem>
                    <SelectItem value="Autre">Autre catégorie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <div className="sm:col-span-2 lg:col-span-1 pt-2 sm:pt-5">
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 border-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Rechercher</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. REASSURANCE / TRUST BADGES */}
      {customization.show_reassurance_badges && (
        <section className="bg-white dark:bg-slate-900 border-b border-border py-6 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] dark:text-blue-300 shrink-0">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Annonces internationales</h4>
                  <p className="text-xs text-muted-foreground">Dans plusieurs pays</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Plateforme sécurisée</h4>
                  <p className="text-xs text-muted-foreground">Annonces vérifiées</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Recherche rapide</h4>
                  <p className="text-xs text-muted-foreground">Filtres multicritères</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Des milliers d'offres</h4>
                  <p className="text-xs text-muted-foreground">Pour tous les budgets</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ANTI-FRAUD BANNER (IF CONFIGURED) */}
      {customization.show_anti_fraud_banner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3.5 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong className="font-bold block mb-0.5">Avertissement de sécurité officiel Ndako :</strong>
              {customization.anti_fraud_warning_text}
            </div>
          </div>
        </section>
      )}

      {/* 3. SECTION ANNONCES À LA UNE */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#F97316] mb-1">
              Sélection Ndako
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Annonces à la une
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Découvrez les logements les plus attractifs disponibles à la location dès maintenant.
            </p>
          </div>

          <Link
            to="/annonces"
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#0F3E6D] dark:text-blue-300 hover:text-[#F97316] transition-colors shrink-0"
          >
            <span>Voir toutes les annonces</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 4. SECTION TYPES DE BIENS */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Types de biens
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Trouvez facilement le type de logement qui vous convient.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {propertyCategories.map((cat) => (
              <Link
                key={cat.title}
                to={`/annonces?type=${cat.type}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-square flex flex-col justify-end p-3.5 border border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative z-10 text-white">
                  <h3 className="font-bold text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">{cat.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER: "VOUS AVEZ UN LOGEMENT À LOUER ?" */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F3E6D] via-[#0A2540] to-[#0A2540] text-white p-8 sm:p-12 shadow-2xl border border-blue-900">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-6 max-w-2xl">
              {/* House icon graphic */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F97316] flex items-center justify-center shrink-0 shadow-lg">
                <Home className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-balance">
                  Vous avez un logement à louer ?
                </h2>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed text-pretty">
                  Publiez votre annonce sur Ndako et trouvez rapidement des locataires sérieux partout dans le monde.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-amber-300 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Visibilité maximale
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contact WhatsApp direct
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sans intermédiaire
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="shrink-0 w-full sm:w-auto">
              {platformSettings?.allow_public_listings !== false ? (
                <Link to="/publier" className="w-full sm:w-auto block">
                  <Button
                    className="w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-base px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 border-0"
                  >
                    <span>Publier une annonce</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/annonces" className="w-full sm:w-auto block">
                  <Button
                    className="w-full sm:w-auto bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-extrabold text-base px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 border-0"
                  >
                    <span>Explorer le catalogue</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
