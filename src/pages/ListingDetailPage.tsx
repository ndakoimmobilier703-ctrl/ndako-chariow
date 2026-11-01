import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingService } from '@/services/listingService';
import type { Listing } from '@/types';
import { AntiScamModal } from '@/components/common/AntiScamModal';
import { ReviewSection } from '@/components/common/ReviewSection';
import { ListingCard } from '@/components/common/ListingCard';
import {
  Bed,
  Bath,
  Car,
  Maximize2,
  Calendar,
  Eye,
  MapPin,
  ShieldCheck,
  Phone,
  ArrowLeft,
  Share2,
  Heart,
  CheckCircle,
  AlertTriangle,
  Building,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Anti-scam modal state
  const [antiScamOpen, setAntiScamOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      setLoading(true);
      try {
        const item = await listingService.getListingById(id);
        if (item) {
          setListing(item);
          // Fetch related in same country/city
          const all = await listingService.getActiveListings();
          setRelatedListings(all.filter((l) => l.id !== item.id).slice(0, 3));
        } else {
          setListing(null);
        }
      } catch {
        toast.error('Erreur lors du chargement de l annonce');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-[450px] w-full bg-muted rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 h-96 bg-muted rounded-2xl animate-pulse" />
            <div className="h-96 bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mx-auto text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-foreground">Annonce introuvable ou expirée</h2>
          <p className="text-sm text-muted-foreground">
            Ce logement a peut-être été loué, retiré ou sa durée de publication est arrivée à échéance.
          </p>
          <Button onClick={() => navigate('/annonces')} className="bg-[#0F3E6D] text-white">
            Retourner au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${listing.title} sur Ndako`,
          text: `Découvrez cette annonce de location à ${listing.city} sur Ndako :`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  const handleWhatsApp = () => {
    const cleanNumber = listing.whatsapp_number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour, je vous contacte au sujet de votre annonce "${listing.title}" publiée sur Ndako (${listing.city}, ${listing.price.toLocaleString()} ${listing.currency}/mois). Le logement est-il toujours disponible à la location ?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  // Called when user clicks "Appeler" -> opens mandatory Anti-Scam modal
  const handleCallClick = () => {
    setAntiScamOpen(true);
  };

  // Called only after user confirms warning inside the Anti-Scam modal
  const handleConfirmCall = () => {
    setAntiScamOpen(false);
    const cleanNumber = listing.phone_number.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar / Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6 text-sm">
          <Link
            to="/annonces"
            className="inline-flex items-center gap-1.5 font-bold text-[#0F3E6D] dark:text-blue-300 hover:text-[#F97316] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les annonces</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-xl flex items-center gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsFavorite(!isFavorite);
                toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté à vos favoris !');
              }}
              className={`rounded-xl flex items-center gap-1.5 text-xs ${
                isFavorite ? 'text-red-600 border-red-200' : ''
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-600' : ''}`} />
              <span>Favori</span>
            </Button>
          </div>
        </div>

        {/* 1. PHOTO GALLERY */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-border shadow-sm mb-8">
          {/* Main Photo */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={photos[activePhotoIdx]}
              alt={listing.title}
              className="w-full h-full object-cover transition-all duration-300"
            />

            {/* Property Type Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider text-white bg-[#0F3E6D] shadow-md">
                {listing.property_type}
              </span>
            </div>

            {/* Photo Counter */}
            <div className="absolute bottom-4 right-4 z-10 bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md">
              Photo {activePhotoIdx + 1} / {photos.length}
            </div>

            {/* Navigation Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white flex items-center justify-center text-foreground shadow-md transition-transform hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 hover:bg-white flex items-center justify-center text-foreground shadow-md transition-transform hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails list (up to 12 photos) */}
          {photos.length > 1 && (
            <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activePhotoIdx
                      ? 'border-[#0F3E6D] shadow-md scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 2. MAIN GRID: SPECS & DETAILS + STICKY CONTACT CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details, Specs, Amenities, Map */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Key Specs Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                <span>
                  {listing.country} • {listing.city} • {listing.neighborhood}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {listing.title}
              </h1>

              {/* Price & Caution */}
              <div className="flex flex-wrap items-baseline gap-3 pt-2 pb-4 border-b border-border">
                <div className="text-3xl sm:text-4xl font-black text-[#0F3E6D] dark:text-blue-300">
                  {listing.price.toLocaleString('fr-FR')} {listing.currency}
                </div>
                <div className="text-sm font-semibold text-muted-foreground">/ mois</div>
                <div className="ml-auto px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-900">
                  Caution : {listing.caution_months} {listing.caution_months > 1 ? 'mois' : 'mois'}
                </div>
              </div>

              {/* Specs Icons Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/60 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] shrink-0">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Chambres</div>
                    <div className="text-sm font-bold text-foreground">
                      {listing.bedrooms} {listing.bedrooms > 1 ? 'chambres' : 'chambre'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/60 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] shrink-0">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Salles de bain</div>
                    <div className="text-sm font-bold text-foreground">{listing.bathrooms} SDB</div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/60 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] shrink-0">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Superficie</div>
                    <div className="text-sm font-bold text-foreground">
                      {listing.surface_sqm > 0 ? `${listing.surface_sqm} m²` : 'Non précisé'}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/60 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Parking</div>
                    <div className="text-sm font-bold text-foreground">
                      {listing.parking_spaces > 0 ? `${listing.parking_spaces} places` : 'Aucun'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
              <h3 className="text-lg font-black text-foreground tracking-tight">
                Description du logement
              </h3>
              <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line text-pretty">
                {listing.description}
              </p>

              {listing.address && (
                <div className="pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Adresse : {listing.address}</span>
                </div>
              )}
            </div>

            {/* Amenities & Equipments */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
              <h3 className="text-lg font-black text-foreground tracking-tight">
                Équipements & Commodités incluses
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.amenities && listing.amenities.length > 0 ? (
                  listing.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-foreground border border-border/60"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun équipement renseigné.</p>
                )}
              </div>
            </div>

            {/* Localisation & Interactive Map */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-border shadow-xs space-y-4">
              <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#F97316]" /> Localisation : {listing.city},{' '}
                {listing.neighborhood}
              </h3>
              <p className="text-xs text-muted-foreground">
                Le logement est situé dans le quartier {listing.neighborhood} à {listing.city} (
                {listing.country}).
              </p>
              <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-border">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&q=${encodeURIComponent(
                    `${listing.neighborhood}, ${listing.city}, ${listing.country}`
                  )}&language=fr&region=cg`}
                  allowFullScreen
                  title={`Carte ${listing.city}`}
                />
              </div>
            </div>

            {/* Reviews Section (Étape 4) */}
            <ReviewSection listingId={listing.id} listingTitle={listing.title} />
          </div>

          {/* Right Column: Contact Bailleur / Agent Sticky Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-[#0F3E6D]/20 shadow-xl space-y-6">
              {/* Advertiser Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F3E6D] to-[#F97316] text-white flex items-center justify-center font-black text-xl shadow-md">
                  {listing.advertiser_name ? listing.advertiser_name.charAt(0).toUpperCase() : 'N'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-base text-foreground">{listing.advertiser_name}</h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En ligne" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Annonceur vérifié Ndako</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* 1. WhatsApp Button */}
                <Button
                  onClick={handleWhatsApp}
                  className="w-full h-13 bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border-0"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.771.865 2.796.865 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.583-5.772-5.768-5.772zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.186-.544-1.859-.769-3.045-2.656-3.138-2.78-.093-.124-.753-.999-.753-1.905 0-.907.474-1.353.643-1.539.169-.187.368-.233.491-.233.123 0 .247.001.355.006.113.006.265-.043.415.318.156.375.534 1.305.58 1.4.047.094.078.204.016.328-.063.125-.094.204-.187.312-.094.11-.197.245-.281.33-.094.093-.192.196-.083.383.11.188.487.805 1.045 1.302.719.64 1.326.839 1.514.933.187.094.296.078.405-.047.11-.125.468-.544.593-.732.124-.188.249-.156.415-.094.167.062 1.058.499 1.24.592.182.093.303.14.348.218.046.079.046.452-.098.857z" />
                  </svg>
                  <span>Contacter sur WhatsApp</span>
                </Button>

                {/* 2. Call Button (Triggers mandatory Anti-Scam warning dialog) */}
                <Button
                  onClick={handleCallClick}
                  variant="outline"
                  className="w-full h-13 border-2 border-[#0F3E6D] text-[#0F3E6D] dark:text-blue-300 hover:bg-[#0F3E6D]/10 font-bold text-sm rounded-2xl flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5 text-[#0F3E6D]" />
                  <span>Appeler le bailleur</span>
                </Button>
              </div>

              {/* Vigilance & Anti-Fraud Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Conseil de sécurité Ndako</span>
                </div>
                <p className="text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                  Ne transférez <strong>jamais</strong> d'argent avant d'avoir visité les lieux en personne et vérifié les titres du propriétaire.
                </p>
              </div>

              {/* Publication details */}
              <div className="text-[11px] text-muted-foreground space-y-1.5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span>Numéro direct :</span>
                  <span className="font-mono font-medium text-foreground">{listing.phone_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Réf. annonce :</span>
                  <span className="font-mono font-medium">{listing.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vues :</span>
                  <span className="font-medium text-foreground">{listing.views_count || 1} consultations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RELATED LISTINGS */}
        {relatedListings.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="text-xl sm:text-2xl font-black text-foreground mb-6">
              Autres logements recommandés
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedListings.map((rel) => (
                <ListingCard key={rel.id} listing={rel} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mandatory Anti-Scam Modal before placing the phone call */}
      <AntiScamModal
        isOpen={antiScamOpen}
        onClose={() => setAntiScamOpen(false)}
        onConfirmCall={handleConfirmCall}
        phoneNumber={listing.phone_number}
      />
    </div>
  );
};
