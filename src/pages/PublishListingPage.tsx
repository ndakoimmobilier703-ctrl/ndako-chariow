import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingService } from '@/services/listingService';
import { supabase } from '@/db/supabase';
import type { PropertyType, PublicationPlan, PlatformSettings, PromoCode } from '@/types';
import { PromoCodeService } from '@/services/promoCodeService';
import { analyticsService } from '@/services/analyticsService';
import { sanitizeText, validateImageFile, isValidPhone } from '@/lib/sanitize';
import {
  Upload,
  Image as ImageIcon,
  ImagePlus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Ticket,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AMENITY_LIST = [
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
  'Groupe électrogène',
  'Balcon / Terrasse',
];

const PRESET_SAMPLE_PHOTOS = [
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_52b953c9-f5ef-432e-8596-86b681225fc9.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_3db4fbe5-612c-49b5-8b96-6768eced7e49.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_0d0af3d4-72be-4dda-9efd-2020ebcd456a.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_87425865-c7d0-4253-af90-e4717c67a2ef.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_542a2ab1-f527-4bb7-a4e6-a423652af599.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_45370c5a-8dd8-445f-a364-f02864b15009.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_597e44c5-1c53-417f-9123-cd9597302290.jpg',
  'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a0cef262-2512-427c-aab6-0f63e9b7026e.jpg',
];

export const PublishListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  // Platform settings & plans
  const [settings, setSettings] = useState<PlatformSettings>({
    id: 'default',
    mode_publication: 'paid',
    allow_instant_publish: true,
    allow_homepage_promo_ads: true,
    allow_public_listings: true,
  });
  const [plans, setPlans] = useState<PublicationPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_1_month');

  // Form State - Step 1: Bien
  const [propertyType, setPropertyType] = useState<PropertyType>('Maison');
  const [customPropertyType, setCustomPropertyType] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [surfaceSqm, setSurfaceSqm] = useState<string>('120');
  const [bedrooms, setBedrooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [parkingSpaces, setParkingSpaces] = useState<string>('1');
  const [photos, setPhotos] = useState<string[]>([
    PRESET_SAMPLE_PHOTOS[0],
    PRESET_SAMPLE_PHOTOS[1],
    PRESET_SAMPLE_PHOTOS[2],
  ]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Électricité',
    'Eau courante',
    'Climatisation',
    'Sécurité',
  ]);

  // Form State - Step 2: Localisation
  const [country, setCountry] = useState<string>('Congo');
  const [countryCode, setCountryCode] = useState<string>('CG');
  const [city, setCity] = useState<string>('Brazzaville');
  const [neighborhood, setNeighborhood] = useState<string>('Talangaï');
  const [address, setAddress] = useState<string>('Avenue de la Paix');

  // Form State - Step 3: Prix & Contact
  const [price, setPrice] = useState<string>('250000');
  const [currency, setCurrency] = useState<string>('FCFA');
  const [cautionMonths, setCautionMonths] = useState<string>('2');
  const [advertiserName, setAdvertiserName] = useState<string>('Cabinet Immocongo');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('+242 06 543 2190');
  const [phoneNumber, setPhoneNumber] = useState<string>('+242 06 543 2190');
  const [description, setDescription] = useState<string>(
    'Magnifique logement spacieux et lumineux situé dans un quartier résidentiel calme. Proche des commerces, des écoles et des grands axes. Sécurité 24h/24.'
  );

  // Form State - Step 4: Règlement (si payant)
  const [payerEmail, setPayerEmail] = useState<string>('');
  const [payerPhone, setPayerPhone] = useState<string>('+242 06 543 2190');
  const [payerName, setPayerName] = useState<string>('Idriss Mozice');

  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [promoFeedback, setPromoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setPromoFeedback({ type: 'error', message: 'Veuillez saisir un code promotionnel.' });
      return;
    }
    setIsValidatingPromo(true);
    const selectedPlan = plans.find((p) => p.id === selectedPlanId) || {
      duration_days: 30,
      price_fcfa: 3000,
    };
    const res = await PromoCodeService.validatePromoCode(promoCodeInput, selectedPlan.price_fcfa);
    setIsValidatingPromo(false);

    if (res.valid && res.promo && res.finalPrice === 0) {
      setAppliedPromo(res.promo);
      setPromoFeedback({
        type: 'success',
        message: res.message,
      });
      toast.success('Code promo validé ! Publication gratuite accordée.');
    } else {
      setAppliedPromo(null);
      setPromoFeedback({
        type: 'error',
        message: res.valid && res.finalPrice > 0 ? 'Ce code ne couvre pas la totalité des frais. Utilisez un code de publication gratuite.' : res.message,
      });
      toast.error(res.message);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoFeedback(null);
    setPromoCodeInput('');
    toast.info('Code promotionnel retiré.');
  };

  useEffect(() => {
    const initData = async () => {
      const [platSettings, pubPlans] = await Promise.all([
        listingService.getPlatformSettings(),
        listingService.getPublicationPlans(),
      ]);
      setSettings(platSettings);
      setPlans(pubPlans);
      if (pubPlans.length > 0) {
        setSelectedPlanId(pubPlans[0].id);
      }
      if (platSettings.allow_public_listings === false) {
        toast.error('La publication de nouvelles annonces est temporairement suspendue par l\'administrateur.');
        navigate('/');
        return;
      }
    };
    initData();
  }, [navigate]);

  const handleCountryChange = (val: string) => {
    setCountry(val);
    const codeMap: Record<string, string> = {
      Congo: 'CG',
      "Côte d'Ivoire": 'CI',
      Sénégal: 'SN',
      Cameroun: 'CM',
      Bénin: 'BJ',
    };
    setCountryCode(codeMap[val] || 'CG');

    // Default cities by country
    const cityMap: Record<string, string> = {
      Congo: 'Brazzaville',
      "Côte d'Ivoire": 'Abidjan',
      Sénégal: 'Dakar',
      Cameroun: 'Yaoundé',
      Bénin: 'Cotonou',
    };
    if (cityMap[val]) {
      setCity(cityMap[val]);
    }
  };

  // Handle multiple image selection directly from phone gallery / file picker
  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 12) {
      toast.error(`Vous pouvez ajouter jusqu'à 12 photos maximum (actuellement ${photos.length}).`);
      return;
    }

    setIsUploading(true);
    const newPhotosList: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // File validation: MIME type and max size 5MB
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // Read file as data URL for instant zero-latency preview
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Also attempt upload to Supabase storage in background if possible
        try {
          const uploadedUrl = await listingService.uploadListingPhoto(file);
          newPhotosList.push(uploadedUrl || dataUrl);
        } catch {
          newPhotosList.push(dataUrl);
        }
      } catch {
        toast.error(`Erreur de lecture du fichier ${file.name}`);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotosList].slice(0, 12));
    setIsUploading(false);
    toast.success(`${newPhotosList.length} photo(s) ajoutée(s) depuis votre appareil !`);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  // Replace a specific photo
  const handleReplaceClick = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || replaceIndex === null) return;
    const file = files[0];

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(`${file.name}: ${validation.error}`);
      return;
    }

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let finalUrl = dataUrl;
      try {
        const uploadedUrl = await listingService.uploadListingPhoto(file);
        if (uploadedUrl) finalUrl = uploadedUrl;
      } catch {
        // fallback to dataUrl
      }

      setPhotos((prev) => {
        const updated = [...prev];
        updated[replaceIndex] = finalUrl;
        return updated;
      });
      toast.success('Photo remplacée avec succès !');
    } catch {
      toast.error('Erreur lors du remplacement de la photo.');
    } finally {
      setReplaceIndex(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (photos.length <= 1) {
      toast.error('Une photo principale est requise.');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
    toast.info('Photo supprimée.');
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Step Validations
  const validateStep1 = () => {
    if (!title.trim()) {
      toast.error('Veuillez renseigner le titre de votre annonce.');
      return false;
    }
    if (photos.length === 0) {
      toast.error('Veuillez ajouter au moins une photo du logement.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!city.trim() || !neighborhood.trim()) {
      toast.error('Veuillez renseigner la ville et le quartier.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!price || parseInt(price, 10) <= 0) {
      toast.error('Veuillez indiquer un loyer mensuel valide.');
      return false;
    }
    if (!whatsappNumber.trim()) {
      toast.error('Le numéro WhatsApp international est obligatoire.');
      return false;
    }
    if (!isValidPhone(whatsappNumber)) {
      toast.error('Numéro WhatsApp invalide : veuillez indiquer au moins 8 chiffres avec l indicatif.');
      return false;
    }
    if (!phoneNumber.trim()) {
      toast.error('Le numéro de téléphone direct est obligatoire.');
      return false;
    }
    if (!isValidPhone(phoneNumber)) {
      toast.error('Numéro de téléphone invalide : veuillez indiquer au moins 8 chiffres.');
      return false;
    }
    if (!description.trim() || description.length < 20) {
      toast.error('Veuillez fournir une description détaillée du logement (au moins 20 caractères).');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    analyticsService.recordAction(
      `action_publish_step_${currentStep}`,
      `Validation Étape ${currentStep}`,
      'publish',
      '/publier',
      'Dépôt d\'annonce immobilière'
    );
    setCurrentStep((prev) => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo(0, 0);
  };

  // Final submission: paid listings are created as pending and activated only by Chariow Pulse.
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const selectedPlan = plans.find((p) => p.id === selectedPlanId) || {
      id: 'plan_1_month', duration_days: 30, price_fcfa: 3000,
    };

    try {
      const currentSettings = await listingService.getPlatformSettings();
      if (currentSettings.allow_public_listings === false) {
        toast.error("La publication de nouvelles annonces est temporairement suspendue par l'administrateur.");
        navigate('/');
        return;
      }
      const isFreePublication = currentSettings.mode_publication === 'free' || !!appliedPromo;
      const listingPayload = {
        title: sanitizeText(title),
        description: sanitizeText(description),
        property_type: propertyType === 'Autre' && customPropertyType.trim()
          ? ('Autre' as PropertyType) : propertyType,
        price: parseInt(price, 10),
        currency,
        caution_months: parseInt(cautionMonths, 10),
        bedrooms: parseInt(bedrooms, 10) || 1,
        bathrooms: parseInt(bathrooms, 10) || 1,
        surface_sqm: parseInt(surfaceSqm, 10) || 0,
        parking_spaces: parseInt(parkingSpaces, 10) || 0,
        country,
        country_code: countryCode,
        city: sanitizeText(city),
        neighborhood: sanitizeText(neighborhood),
        address: sanitizeText(address),
        photos,
        amenities: selectedAmenities,
        whatsapp_number: sanitizeText(whatsappNumber),
        phone_number: sanitizeText(phoneNumber),
        advertiser_name: sanitizeText(advertiserName) || 'Propriétaire Ndako',
        duration_days: selectedPlan.duration_days,
        featured: true,
      };

      // Chariow requires buyer identity and email. The backend selects the matching fixed-price product.
      if (!isFreePublication) {
        if (!payerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail.trim())) {
          toast.error('Veuillez saisir une adresse e-mail valide pour recevoir le reçu de paiement.');
          setIsSubmitting(false);
          return;
        }
        if (!isValidPhone(payerPhone)) {
          toast.error('Veuillez saisir un numéro de téléphone valide pour le paiement.');
          setIsSubmitting(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('start-chariow-checkout', {
          body: {
            planId: selectedPlan.id,
            customer: {
              email: payerEmail.trim(),
              name: sanitizeText(payerName) || advertiserName,
              phone: sanitizeText(payerPhone),
              countryCode,
            },
            listing: listingPayload,
          },
        });
        if (error) throw new Error(error.message || 'Impossible de démarrer le paiement Chariow.');
        if (!data?.checkoutUrl) throw new Error(data?.error || 'Lien de paiement Chariow indisponible.');
        window.location.assign(data.checkoutUrl);
        return;
      }

      // Free mode and full-discount promo publications are created server-side.
      // The browser never writes directly to listings or transactions.
      const { data: freeResult, error: freeError } = await supabase.functions.invoke('create-free-listing', {
        body: {
          planId: selectedPlan.id,
          promoCode: appliedPromo?.code || null,
          customer: {
            name: sanitizeText(payerName) || sanitizeText(advertiserName),
            phone: sanitizeText(payerPhone || whatsappNumber || phoneNumber),
          },
          listing: listingPayload,
        },
      });
      if (freeError) throw new Error(freeError.message || 'Impossible de publier gratuitement.');
      if (!freeResult?.listingId) throw new Error(freeResult?.error || 'La publication gratuite n’a pas pu être confirmée.');

      setCreatedListingId(freeResult.listingId);
      setCurrentStep(5);
      toast.success(appliedPromo
        ? `Code promo ${appliedPromo.code} appliqué ! Votre annonce a été publiée gratuitement.`
        : 'Votre annonce a été publiée gratuitement avec succès !');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlan = plans.find((p) => p.id === selectedPlanId) || {
    title: '1 mois',
    price_fcfa: 3000,
    duration_days: 30,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F3E6D]/10 text-[#0F3E6D] dark:text-blue-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Plateforme internationale de location</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Publier une annonce
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Remplissez les informations de votre logement pour le rendre visible auprès de milliers de locataires.
          </p>
        </div>

        {/* Step Indicator (Steps 1 to 4) */}
        {currentStep <= 4 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-border shadow-xs mb-8">
            <div className="flex items-center justify-between">
              {[
                { step: 1, label: 'Le Bien' },
                { step: 2, label: 'Localisation' },
                { step: 3, label: 'Prix & Contact' },
                { step: 4, label: 'Durée & Publication' },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                        currentStep === item.step
                          ? 'bg-[#0F3E6D] text-white shadow-md scale-105'
                          : currentStep > item.step
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                      }`}
                    >
                      {currentStep > item.step ? <CheckCircle2 className="w-5 h-5" /> : item.step}
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                        currentStep === item.step
                          ? 'text-[#0F3E6D] dark:text-blue-300 font-bold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-0.5 w-8 sm:w-16 md:w-24 mx-2 transition-colors ${
                        currentStep > item.step ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAIN STEP CARDS */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-border shadow-sm">
          {/* STEP 1: INFORMATIONS SUR LE BIEN */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground">1. Informations sur le bien</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Décrivez la catégorie, le titre et ajoutez jusqu'à 12 photos de votre logement.
                </p>
              </div>

              {/* Type de bien */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Type de bien immobilier *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(['Maison', 'Appartement', 'Studio', 'Villa', 'Bureau', 'Autre'] as PropertyType[]).map(
                    (t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPropertyType(t)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                          propertyType === t
                            ? 'bg-[#0F3E6D] text-white border-[#0F3E6D] shadow-xs'
                            : 'bg-card text-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
                {propertyType === 'Autre' && (
                  <div className="pt-2">
                    <Input
                      placeholder="Précisez le type personnalisé (ex. Duplex, Loft, etc.)"
                      value={customPropertyType}
                      onChange={(e) => setCustomPropertyType(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Titre */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Titre de l'annonce *
                </label>
                <Input
                  placeholder="Ex. Superbe villa 4 pièces avec piscine et jardin arboré"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Photos upload (up to 12) directly from device */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                      Photos du logement ({photos.length} / 12 photos) *
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      La première photo servira de photo de couverture principale.
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#0F3E6D]/10 text-[#0F3E6D]">
                    {photos.length} / 12
                  </span>
                </div>

                {/* Hidden Native File Inputs */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFilesSelect}
                />
                <input
                  type="file"
                  ref={replaceInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleReplaceFile}
                />

                {/* Main Action Button: Opens phone gallery / file selector */}
                <Button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={photos.length >= 12 || isUploading}
                  className="w-full min-h-14 h-auto py-3.5 px-4 border-2 border-dashed border-[#0F3E6D]/40 hover:border-[#0F3E6D] bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 text-[#0F3E6D] dark:text-blue-300 rounded-2xl flex items-center justify-center gap-2.5 font-bold transition-all shadow-xs"
                >
                  <ImagePlus className="w-5 h-5 text-[#F97316] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-center leading-snug break-words">
                    {isUploading ? (
                      'Chargement des photos...'
                    ) : photos.length >= 12 ? (
                      'Limite de 12 photos atteinte'
                    ) : (
                      <>
                        <span className="sm:hidden">Ajouter des photos depuis la galerie</span>
                        <span className="hidden sm:inline">Ajouter des photos depuis la galerie de votre appareil</span>
                      </>
                    )}
                  </span>
                </Button>

                {/* Photo Previews Grid with Delete & Replace Actions */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                    {photos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border group bg-slate-100 dark:bg-slate-800 shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-[#0F3E6D] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                            Couverture
                          </div>
                        )}

                        {/* Hover Overlay with Remplacer and Supprimer buttons */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReplaceClick(idx)}
                            className="w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center hover:bg-slate-100 shadow-md transition-transform hover:scale-110"
                            title="Remplacer cette photo"
                            aria-label="Remplacer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                            title="Supprimer cette photo"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Surface & Rooms */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Superficie (m²)</label>
                  <Input
                    type="number"
                    value={surfaceSqm}
                    onChange={(e) => setSurfaceSqm(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nombre de chambres</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Ex: 3"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Salles de bain</label>
                  <Input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Places parking</label>
                  <Input
                    type="number"
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Commodités & Équipements
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AMENITY_LIST.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`text-left text-xs p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#0F3E6D]/10 text-[#0F3E6D] border-[#0F3E6D] font-bold'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        <span className="truncate">{amenity}</span>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3E6D] shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCALISATION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground">2. Localisation géographique</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Précisez le pays, la ville et le quartier où se trouve le logement.
                </p>
              </div>

              {/* Pays */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Pays *
                </label>
                <Select value={country} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-full bg-card rounded-xl h-11">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Congo">🇨🇬 Congo (République du Congo)</SelectItem>
                    <SelectItem value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</SelectItem>
                    <SelectItem value="Sénégal">🇸🇳 Sénégal</SelectItem>
                    <SelectItem value="Cameroun">🇨🇲 Cameroun</SelectItem>
                    <SelectItem value="Bénin">🇧🇯 Bénin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Ville *
                </label>
                <Input
                  placeholder="Ex. Brazzaville, Pointe-Noire, Abidjan, Dakar..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Quartier */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Quartier *
                </label>
                <Input
                  placeholder="Ex. Talangaï, Cocody, Ouakam, Bastos, East Legon..."
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* Adresse précise */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Adresse précise / Point de repère
                </label>
                <Input
                  placeholder="Ex. Rue de la Paix, à proximité du grand marché"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>
          )}

          {/* STEP 3: PRIX & COORDONNÉES DE CONTACT */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground">3. Prix et coordonnées de contact</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Définissez les conditions de loyer et vos numéros directs pour être contacté.
                </p>
              </div>

              {/* Loyer et Devise */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Montant du loyer mensuel *
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex. 250000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded-xl h-11 font-bold text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Devise
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-full bg-card rounded-xl h-11 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FCFA">FCFA (XAF/XOF)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="MAD">MAD (Dirham)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Caution */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Nombre de mois de caution demandés *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCautionMonths(m)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        cautionMonths === m
                          ? 'bg-[#0F3E6D] text-white border-[#0F3E6D]'
                          : 'bg-card text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {m} {parseInt(m, 10) > 1 ? 'mois' : 'mois'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annonceur Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Nom ou raison sociale de l'annonceur
                </label>
                <Input
                  placeholder="Ex. Jean Moukoko ou Agence Immo Prestige"
                  value={advertiserName}
                  onChange={(e) => setAdvertiserName(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>

              {/* WhatsApp & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Numéro WhatsApp international *
                  </label>
                  <Input
                    placeholder="Ex. +242065432190"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="rounded-xl h-11"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Incluez l indicatif pays (ex: +242, +225, +221, etc.)
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Numéro d'appel direct *
                  </label>
                  <Input
                    placeholder="Ex. +242 06 543 2190"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl h-11"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    Pour les appels après avertissement anti-fraude
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Description détaillée du bien *
                </label>
                <Textarea
                  rows={4}
                  placeholder="Décrivez les atouts du logement, l état général, les conditions particulières..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {/* STEP 4: DURÉE ET RÈGLEMENT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-black text-foreground">4. Formule de parution & Publication</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Choisissez la durée d'affichage de votre annonce sur Ndako.
                </p>
              </div>

              {/* Status Notice: Mode Payant vs Mode Gratuit */}
              {settings.mode_publication === 'free' ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Offre spéciale : Publication gratuite activée !
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      L'administrateur a temporairement activé la publication gratuite. Aucun frais ne vous sera facturé aujourd'hui.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl p-4 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#0F3E6D] dark:text-blue-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#0F3E6D] dark:text-blue-300">
                      Publication sécurisée certifiée
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Règlement par Mobile Money ou Carte bancaire. Votre annonce sera immédiatement activée dès validation.
                    </p>
                  </div>
                </div>
              )}

              {/* Duration plans selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Sélectionnez la durée de publication *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((p) => {
                    const isSelected = selectedPlanId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0F3E6D] bg-[#0F3E6D]/5 shadow-md'
                            : 'border-border hover:border-slate-400 bg-card'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">{p.title}</span>
                            <span className="text-xs text-muted-foreground font-medium">
                              ({p.duration_days} jours)
                            </span>
                          </div>
                          <div className="text-xl font-black text-[#0F3E6D] dark:text-blue-300">
                            {settings.mode_publication === 'free' ? (
                              <span className="text-emerald-600">Gratuit</span>
                            ) : (
                              `${p.price_fcfa.toLocaleString('fr-FR')} FCFA`
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>Visible {p.duration_days} jours consécutifs</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Code Promotionnel Input Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Code Promotionnel
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-0.5 rounded-full">
                    Offre Publication Gratuite
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vous disposez d'un code promotionnel délivré par l'administrateur ? Saisissez-le pour publier gratuitement.
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ex. CONGO2026 ou NDAKO-BIENVENUE"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value.toUpperCase());
                      setPromoFeedback(null);
                    }}
                    disabled={!!appliedPromo}
                    className="rounded-xl uppercase font-mono tracking-wider font-bold h-11 bg-card"
                  />
                  {appliedPromo ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemovePromo}
                      className="rounded-xl border-red-300 text-red-600 hover:bg-red-50 text-xs shrink-0 h-11 px-4 font-bold"
                    >
                      Retirer
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={isValidatingPromo || !promoCodeInput.trim()}
                      className="bg-[#0F3E6D] text-white hover:bg-[#0A2540] rounded-xl text-xs font-bold px-4 shrink-0 h-11"
                    >
                      {isValidatingPromo ? 'Vérification...' : 'Appliquer'}
                    </Button>
                  )}
                </div>

                {promoFeedback && (
                  <div
                    className={`text-xs p-3 rounded-xl flex items-center gap-2 ${
                      promoFeedback.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {promoFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{promoFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* If Promo applied: Show free publication confirmation card */}
              {appliedPromo ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <span>Code Promo {appliedPromo.code} Validé !</span>
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-md font-bold">
                          100% Offert
                        </span>
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Publication gratuite accordée pour la formule {activePlan.title} ({activePlan.duration_days} jours). Aucun paiement requis.
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground line-through">
                      {activePlan.price_fcfa.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="text-xl font-black text-emerald-600">
                      0 FCFA
                    </div>
                  </div>
                </div>
              ) : settings.mode_publication === 'paid' ? (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Paiement sécurisé par Chariow
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vous serez redirigé vers la page sécurisée de Chariow. Les moyens de paiement disponibles (Mobile Money ou carte bancaire) dépendront de votre pays.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Nom complet du payeur *</label>
                        <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground">Adresse e-mail *</label>
                        <Input type="email" autoComplete="email" placeholder="exemple@email.com" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-muted-foreground">Numéro de téléphone du payeur *</label>
                        <Input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} className="rounded-xl" />
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-border flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold text-foreground">Total à régler :</span>
                      <p className="text-xs text-muted-foreground">
                        Formule {activePlan.title} ({activePlan.duration_days} jours)
                      </p>
                    </div>
                    <div className="text-2xl font-black text-[#0F3E6D] dark:text-blue-300">
                      {activePlan.price_fcfa.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 5: CONFIRMATION / SUCCESS */}
          {currentStep === 5 && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Félicitations ! Annonce en ligne
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre annonce « <strong>{title}</strong> » a été validée et enregistrée avec succès. Elle est désormais visible sur Ndako.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-5 max-w-md mx-auto border border-border text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ville & Pays :</span>
                  <span className="font-semibold text-foreground">
                    {city}, {country}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée accordée :</span>
                  <span className="font-semibold text-foreground">{activePlan.duration_days} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date d'expiration :</span>
                  <span className="font-semibold text-foreground">
                    {new Date(Date.now() + activePlan.duration_days * 86400000).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode de parution :</span>
                  <span className="font-semibold text-foreground uppercase">
                    {settings.mode_publication === 'paid' ? 'Payant (Validé)' : 'Gratuit'}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                {createdListingId && (
                  <Link to={`/annonces/${createdListingId}`}>
                    <Button className="w-full sm:w-auto bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold px-6 rounded-xl">
                      Voir mon annonce
                    </Button>
                  </Link>
                )}
                <Link to="/annonces">
                  <Button variant="outline" className="w-full sm:w-auto font-semibold rounded-xl">
                    Retourner au catalogue
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Steps 1 - 4 */}
          {currentStep <= 4 && (
            <div className="mt-10 pt-6 border-t border-border flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="rounded-xl flex items-center gap-1.5 font-semibold text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Étape précédente</span>
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold rounded-xl px-6 flex items-center gap-1.5"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white font-black text-sm px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting
                    ? 'Traitement en cours...'
                    : settings.mode_publication === 'paid'
                    ? `Payer et publier (${activePlan.price_fcfa.toLocaleString('fr-FR')} FCFA)`
                    : 'Publier gratuitement'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
