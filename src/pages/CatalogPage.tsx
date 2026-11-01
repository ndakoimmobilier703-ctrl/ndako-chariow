import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingService } from '@/services/listingService';
import type { Listing, SearchFilters } from '@/types';
import { ListingCard } from '@/components/common/ListingCard';
import {
  SlidersHorizontal,
  Search,
  RotateCcw,
  MapPin,
  Building,
  Home,
  Check,
  X,
  Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const AMENITY_OPTIONS = [
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
];

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Visitor simulated country for the 75% / 25% distribution algorithm
  const [visitorCountry, setVisitorCountry] = useState<string>('Congo');

  // Filter states
  const [country, setCountry] = useState<string>(searchParams.get('country') || 'all');
  const [city, setCity] = useState<string>(searchParams.get('city') || 'all');
  const [neighborhood, setNeighborhood] = useState<string>('all');
  const [propertyType, setPropertyType] = useState<string>(searchParams.get('type') || 'all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [bedrooms, setBedrooms] = useState<string>('all');
  const [cautionMonths, setCautionMonths] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {
        country: country !== 'all' ? country : undefined,
        city: city !== 'all' ? city : undefined,
        neighborhood: neighborhood !== 'all' ? neighborhood : undefined,
        property_type: propertyType !== 'all' ? propertyType : undefined,
        min_price: minPrice ? parseInt(minPrice, 10) : undefined,
        max_price: maxPrice ? parseInt(maxPrice, 10) : undefined,
        bedrooms: bedrooms !== 'all' ? parseInt(bedrooms, 10) : undefined,
        caution_months: cautionMonths !== 'all' ? parseInt(cautionMonths, 10) : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        keyword: keyword.trim() || undefined,
      };

      const results = await listingService.getActiveListings(filters, visitorCountry);
      setListings(results);
    } catch {
      // service handles fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [country, city, neighborhood, propertyType, minPrice, maxPrice, bedrooms, cautionMonths, selectedAmenities, visitorCountry]);

  // Handle amenities toggle
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleResetFilters = () => {
    setCountry('all');
    setCity('all');
    setNeighborhood('all');
    setPropertyType('all');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('all');
    setCautionMonths('all');
    setKeyword('');
    setSelectedAmenities([]);
    setSearchParams({});
  };

  const sortedListings = useMemo(() => {
    const list = [...listings];
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.price - a.price);
    }
    return list; // default recent / geo order
  }, [listings, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (country !== 'all') count++;
    if (city !== 'all') count++;
    if (neighborhood !== 'all') count++;
    if (propertyType !== 'all') count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (bedrooms !== 'all') count++;
    if (cautionMonths !== 'all') count++;
    if (keyword) count++;
    count += selectedAmenities.length;
    return count;
  }, [country, city, neighborhood, propertyType, minPrice, maxPrice, bedrooms, cautionMonths, keyword, selectedAmenities]);

  const filterSidebarContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0F3E6D]" />
          <h3 className="font-bold text-base text-foreground">Filtres de recherche</h3>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs text-muted-foreground hover:text-red-600 h-8 px-2"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Country Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-[#0F3E6D]" /> Pays
        </label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-full bg-card rounded-xl">
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

      {/* City Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-[#0F3E6D]" /> Ville
        </label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-full bg-card rounded-xl">
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

      {/* Property Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-[#0F3E6D]" /> Type de bien
        </label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-full bg-card rounded-xl">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Maison">Maison</SelectItem>
            <SelectItem value="Appartement">Appartement</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Villa">Villa</SelectItem>
            <SelectItem value="Chambre">Chambre</SelectItem>
            <SelectItem value="Autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
          Fourchette de loyer (FCFA)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min FCFA"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-xl text-xs"
          />
          <Input
            type="number"
            placeholder="Max FCFA"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
          Nombre de chambres
        </label>
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger className="w-full bg-card rounded-xl">
            <SelectValue placeholder="Indifférent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Indifférent</SelectItem>
            <SelectItem value="1">1 chambre ou +</SelectItem>
            <SelectItem value="2">2 chambres ou +</SelectItem>
            <SelectItem value="3">3 chambres ou +</SelectItem>
            <SelectItem value="4">4 chambres ou +</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Caution Months */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
          Caution max demandée
        </label>
        <Select value={cautionMonths} onValueChange={setCautionMonths}>
          <SelectTrigger className="w-full bg-card rounded-xl">
            <SelectValue placeholder="Toutes les cautions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les cautions</SelectItem>
            <SelectItem value="1">1 mois maximum</SelectItem>
            <SelectItem value="2">2 mois maximum</SelectItem>
            <SelectItem value="3">3 mois maximum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Amenities Checkboxes */}
      <div className="space-y-2 pt-2 border-t border-border">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
          Équipements & Commodités
        </label>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {AMENITY_OPTIONS.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                  isChecked
                    ? 'bg-[#0F3E6D]/10 text-[#0F3E6D] border-[#0F3E6D] font-bold'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <span className="truncate">{amenity}</span>
                {isChecked && <Check className="w-3 h-3 shrink-0 ml-1 text-[#0F3E6D]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header / Breadcrumbs & Title */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Catalogue des logements
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explorez toutes les offres de maisons, appartements et villas disponibles à la location.
              </p>
            </div>

            {/* Visitor country selector for geo-recommendation demo */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-white dark:bg-slate-900 p-2 rounded-xl border border-border shadow-xs text-xs">
              <span className="text-muted-foreground">Votre pays (recommandation 75/25) :</span>
              <Select value={visitorCountry} onValueChange={setVisitorCountry}>
                <SelectTrigger className="w-36 h-8 text-xs font-semibold border-0 bg-slate-100 dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Congo">🇨🇬 Congo</SelectItem>
                  <SelectItem value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</SelectItem>
                  <SelectItem value="Sénégal">🇸🇳 Sénégal</SelectItem>
                  <SelectItem value="Cameroun">🇨🇲 Cameroun</SelectItem>
                  <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                  <SelectItem value="Maroc">🇲🇦 Maroc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filter Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Rechercher par quartier, ville, mot-clé..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
                className="pl-9 bg-white dark:bg-slate-900 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              {/* Mobile Filter Sheet Trigger */}
              <div className="md:hidden">
                <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 rounded-xl">
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Filtres ({activeFiltersCount})</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto p-6">
                    <SheetHeader className="mb-4 text-left">
                      <SheetTitle>Filtres de recherche</SheetTitle>
                    </SheetHeader>
                    {filterSidebarContent}
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button
                        onClick={() => setMobileFilterOpen(false)}
                        className="w-full bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold"
                      >
                        Voir les résultats ({listings.length})
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">Trier par :</span>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="w-40 h-10 text-xs rounded-xl bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récents</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar + Results */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs h-fit sticky top-24">
            {filterSidebarContent}
          </aside>

          {/* Listings Results Grid */}
          <main className="col-span-1 md:col-span-3">
            {/* Status summary */}
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{sortedListings.length}</strong> logements trouvés
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[#0F3E6D] hover:underline font-semibold"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : sortedListings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground">
                  <Home className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Aucune annonce correspondante</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Aucun bien ne correspond exactement à vos critères actuels. Essayez d'élargir votre recherche ou de modifier les filtres.
                </p>
                <Button onClick={handleResetFilters} className="bg-[#0F3E6D] text-white">
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
