import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Listing } from '@/types';
import { Bed, Bath, Car, Wifi, MapPin, Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingCardProps {
  listing: Listing;
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
}

// Country code to flag emoji helper
const getCountryFlag = (countryCode: string) => {
  const flags: Record<string, string> = {
    CG: '🇨🇬',
    CI: '🇨🇮',
    SN: '🇸🇳',
    CM: '🇨🇲',
    BJ: '🇧🇯',
    FR: '🇫🇷',
  };
  return flags[countryCode.toUpperCase()] || '🌍';
};

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onFavoriteToggle,
  isFavorite = false,
}) => {
  const [favorite, setFavorite] = useState(isFavorite);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  const mainPhoto =
    listing.photos && listing.photos.length > 0
      ? listing.photos[currentPhotoIdx % listing.photos.length]
      : 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    onFavoriteToggle?.(listing.id);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Clean phone number: remove spaces, dashes, etc.
    const cleanNumber = listing.whatsapp_number.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Bonjour, je vous contacte au sujet de votre annonce "${listing.title}" publiée sur Ndako (${listing.city}, ${listing.price.toLocaleString()} ${listing.currency}/mois). Le logement est-il toujours disponible à la location ?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-border/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Photo Container */}
      <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link to={`/annonces/${listing.id}`} className="block w-full h-full">
          <img
            src={mainPhoto}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Property Type Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-md text-xs font-bold text-white bg-[#0F3E6D] shadow-sm">
            {listing.property_type}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-foreground hover:text-red-500 hover:bg-white transition-all shadow-xs"
          aria-label="Ajouter aux favoris"
        >
          <Heart
            className={`w-4 h-4 ${favorite ? 'fill-red-500 text-red-500' : 'text-slate-700 dark:text-slate-200'}`}
          />
        </button>

        {/* Photo indicator dots */}
        {listing.photos && listing.photos.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs">
            {listing.photos.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentPhotoIdx % listing.photos.length ? 'bg-white w-3' : 'bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location with country flag */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
            <span className="text-sm">{getCountryFlag(listing.country_code)}</span>
            <span className="font-semibold text-foreground truncate">
              {listing.country}, {listing.city}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="truncate text-muted-foreground">{listing.neighborhood}</span>
          </div>

          {/* Title */}
          <Link to={`/annonces/${listing.id}`}>
            <h3 className="font-bold text-foreground text-base line-clamp-1 hover:text-[#0F3E6D] transition-colors mb-2">
              {listing.title}
            </h3>
          </Link>

          {/* Price */}
          <div className="mb-3">
            <span className="text-lg sm:text-xl font-black text-[#0F3E6D] dark:text-blue-300">
              {listing.price.toLocaleString('fr-FR')} {listing.currency}
            </span>
            <span className="text-xs text-muted-foreground font-medium"> / mois</span>
          </div>

          {/* Specs / Features */}
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground py-2 border-t border-border/60 mb-4">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-foreground/70" />
              <span>{listing.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-foreground/70" />
              <span>{listing.bathrooms}</span>
            </div>
            {listing.surface_sqm > 0 && (
              <div className="flex items-center gap-1">
                <span>{listing.surface_sqm} m²</span>
              </div>
            )}
            {listing.parking_spaces > 0 && (
              <div className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-foreground/70" />
                <span>{listing.parking_spaces}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Détails */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
          <Button
            type="button"
            onClick={handleWhatsAppClick}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs border-0"
          >
            {/* WhatsApp SVG Icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.771.865 2.796.865 3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.583-5.772-5.768-5.772zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.186-.544-1.859-.769-3.045-2.656-3.138-2.78-.093-.124-.753-.999-.753-1.905 0-.907.474-1.353.643-1.539.169-.187.368-.233.491-.233.123 0 .247.001.355.006.113.006.265-.043.415.318.156.375.534 1.305.58 1.4.047.094.078.204.016.328-.063.125-.094.204-.187.312-.094.11-.197.245-.281.33-.094.093-.192.196-.083.383.11.188.487.805 1.045 1.302.719.64 1.326.839 1.514.933.187.094.296.078.405-.047.11-.125.468-.544.593-.732.124-.188.249-.156.415-.094.167.062 1.058.499 1.24.592.182.093.303.14.348.218.046.079.046.452-.098.857z" />
            </svg>
            <span>WhatsApp</span>
          </Button>

          <Link to={`/annonces/${listing.id}`} className="w-full">
            <Button
              type="button"
              className="w-full bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-xs border-0"
            >
              <span>Détails</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
