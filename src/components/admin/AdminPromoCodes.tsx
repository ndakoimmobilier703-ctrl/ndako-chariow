import React, { useState, useEffect } from 'react';
import type { PromoCode, PromoCodeUse, PlatformSettings } from '@/types';
import { PromoCodeService } from '@/services/promoCodeService';
import { listingService } from '@/services/listingService';
import {
  Ticket,
  Plus,
  RefreshCw,
  Copy,
  Calendar,
  Power,
  Trash2,
  Check,
  Megaphone,
  EyeOff,
  Eye,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const AdminPromoCodes: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [uses, setUses] = useState<PromoCodeUse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Form states for new promo code
  const [codeName, setCodeName] = useState<string>('');
  const [description, setDescription] = useState<string>('Offre spéciale publication offerte');
  const [maxUses, setMaxUses] = useState<number>(50);
  const [maxUsers, setMaxUsers] = useState<number>(50);
  const [startsAt, setStartsAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expiresAt, setExpiresAt] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [publishBannerImmediately, setPublishBannerImmediately] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    const [allPromos, allUses, currentSettings] = await Promise.all([
      PromoCodeService.getAllPromoCodes(),
      PromoCodeService.getAllPromoUses(),
      listingService.getPlatformSettings(),
    ]);
    setPromos(allPromos);
    setUses(allUses);
    setPlatformSettings(currentSettings);
    setLoading(false);
  };

  const handleTogglePromoBannerSetting = async (enabled: boolean) => {
    if (!platformSettings) return;
    const updated = { ...platformSettings, allow_homepage_promo_ads: enabled };
    setPlatformSettings(updated);
    await listingService.updatePlatformSettings(updated);
    toast.success(
      enabled
        ? "Bannière d'offre promotionnelle activée sur la page d'accueil !"
        : "Bannière d'offre promotionnelle désactivée de la page d'accueil !"
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenGenerate = () => {
    const unique = PromoCodeService.generateUniqueCode('NDAKO');
    setCodeName(unique);
    setDescription('Code promotionnel pour parution gratuite');
    setMaxUses(50);
    setMaxUsers(50);
    const today = new Date().toISOString().split('T')[0];
    const exp = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setStartsAt(today);
    setExpiresAt(exp);
    setPublishBannerImmediately(false);
    setIsGenerateModalOpen(true);
  };

  const handleCreatePromo = async () => {
    if (!codeName.trim()) {
      toast.error('Le code promotionnel ne peut pas être vide.');
      return;
    }
    if (new Date(expiresAt) <= new Date(startsAt)) {
      toast.error('La date d\'expiration doit être postérieure à la date de début.');
      return;
    }

    const res = await PromoCodeService.createPromoCode({
      code: codeName.trim().toUpperCase(),
      description,
      discount_type: 'free_publication',
      discount_value: 100,
      max_uses: maxUses,
      max_users: maxUsers,
      starts_at: new Date(startsAt).toISOString(),
      expires_at: new Date(expiresAt + 'T23:59:59').toISOString(),
    });

    if (res.success && res.promo) {
      if (publishBannerImmediately) {
        await PromoCodeService.toggleBannerPublished(res.promo.id);
      }
      toast.success(`Code promo ${res.promo?.code} généré avec succès !`);
      setIsGenerateModalOpen(false);
      loadData();
    } else {
      toast.error(res.error || 'Erreur lors de la création du code promo.');
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    await PromoCodeService.togglePromoStatus(id);
    toast.success(
      currentActive
        ? 'Code promotionnel désactivé (les utilisateurs ne pourront plus l\'appliquer).'
        : 'Code promotionnel activé avec succès.'
    );
    loadData();
  };

  const handleToggleBanner = async (id: string, currentPublished: boolean) => {
    await PromoCodeService.toggleBannerPublished(id);
    toast.success(
      currentPublished
        ? "Annonce retirée de la page d'accueil (le code reste valide)."
        : "Annonce promotionnelle publiée avec succès sur la page d'accueil !"
    );
    loadData();
  };

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le code promo ${code} ?`)) {
      await PromoCodeService.deletePromo(id);
      toast.success(`Code ${code} supprimé.`);
      loadData();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code ${code} copié dans le presse-papier !`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#F97316]" />
            <h2 className="text-xl font-black text-foreground">Gestion & Publication des Codes Promotionnels</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Contrôlez indépendamment la <strong>validité du code</strong> et la <strong>publication de son annonce</strong> sur la page d'accueil.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            onClick={handleOpenGenerate}
            className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Générer un code promo</span>
          </Button>
        </div>
      </div>

      {/* Quick Action: Promo Banner on Homepage Status */}
      <div className="p-4 rounded-2xl border-2 border-[#0F3E6D]/20 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F3E6D] shrink-0" />
            <span className="text-xs font-black uppercase text-foreground">
              Bannière d'offre promotionnelle d'accueil (Bannière Bleue)
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                platformSettings?.allow_homepage_promo_ads !== false
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {platformSettings?.allow_homepage_promo_ads !== false ? 'Actuellement Visible' : 'Actuellement Masquée'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Bouton rapide pour couper ou rétablir l'affichage de la bannière sur la page d'accueil sans supprimer vos codes promo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant={platformSettings?.allow_homepage_promo_ads !== false ? 'destructive' : 'default'}
            onClick={() =>
              handleTogglePromoBannerSetting(
                platformSettings?.allow_homepage_promo_ads === false
              )
            }
            className="text-xs font-bold rounded-xl h-8 px-3"
          >
            {platformSettings?.allow_homepage_promo_ads !== false ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1" />
                <span>Désactiver de l'accueil</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1" />
                <span>Activer sur l'accueil</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Explanatory Notice: Decoupled Logic */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
          <strong>Principe de découplage total :</strong> La publication de l'annonce promotionnelle sur la page d'accueil est autonome. Vous pouvez masquer l'annonce tout en conservant un code valide pour vos campagnes privées (SMS, WhatsApp), ou désactiver un code même si son bandeau est présent. Toutes les saisies utilisateurs sont validées côté serveur.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Total Codes Créés</div>
          <div className="text-2xl font-black text-foreground mt-1">{promos.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Enregistrés en base</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Codes Valides</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {promos.filter((p) => p.is_active && new Date(p.expires_at) > new Date()).length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Autorisés au paiement</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Annonces à l'Accueil</div>
          <div className="text-2xl font-black text-[#F97316] mt-1">
            {promos.filter((p) => p.is_banner_published).length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Affichées aux visiteurs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Utilisations Réelles</div>
          <div className="text-2xl font-black text-[#0F3E6D] dark:text-blue-300 mt-1">
            {promos.reduce((acc, p) => acc + p.current_uses, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Publications offertes</div>
        </div>
      </div>

      {/* Promo Codes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            Codes promotionnels et état de publication
          </h3>
          <span className="text-xs text-muted-foreground">{promos.length} codes au total</span>
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Code & Quotas</th>
                <th className="p-3.5 whitespace-nowrap">Description</th>
                <th className="p-3.5 whitespace-nowrap">Validité Serveur</th>
                <th className="p-3.5 whitespace-nowrap">Annonce Accueil (Visibilité)</th>
                <th className="p-3.5 whitespace-nowrap">Période</th>
                <th className="p-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Aucun code promo créé. Cliquez sur « Générer un code promo » pour en ajouter un.
                  </td>
                </tr>
              ) : (
                promos.map((p) => {
                  const percentUsed = Math.min(100, Math.round((p.current_uses / p.max_uses) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#0F3E6D] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(p.code)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Copier le code"
                          >
                            {copiedCode === p.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Utilisé {p.current_uses} / {p.max_uses} ({percentUsed}%)
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap max-w-xs truncate text-muted-foreground">
                        {p.description || 'Publication offerte'}
                      </td>

                      {/* Code Validity Control */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p.id, p.is_active)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all border ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                          title="Cliquez pour activer ou désactiver la validité de ce code"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{p.is_active ? 'Actif (Validé)' : 'Désactivé'}</span>
                        </button>
                      </td>

                      {/* Homepage Announcement Toggle (INDEPENDENT) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleBanner(p.id, p.is_banner_published)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all border ${
                            p.is_banner_published
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs hover:bg-amber-600'
                              : 'bg-slate-50 text-slate-500 border-border hover:bg-slate-100 dark:bg-slate-800'
                          }`}
                          title="Cliquez pour afficher ou masquer l'annonce de ce code sur la page d'accueil"
                        >
                          {p.is_banner_published ? (
                            <>
                              <Megaphone className="w-3.5 h-3.5 animate-bounce" />
                              <span>Publiée à l'accueil</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Masquée de l'accueil</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>
                            {new Date(p.starts_at).toLocaleDateString('fr-FR')} →{' '}
                            {new Date(p.expires_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.code)}
                          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Supprimer ce code promo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Modal */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F97316]" />
              Générer un code promotionnel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-foreground">Code promotionnel *</label>
                <button
                  type="button"
                  onClick={() => setCodeName(PromoCodeService.generateUniqueCode('NDAKO'))}
                  className="text-[11px] text-[#0F3E6D] dark:text-blue-400 font-bold hover:underline"
                >
                  Regénérer aléatoirement
                </button>
              </div>
              <Input
                value={codeName}
                onChange={(e) => setCodeName(e.target.value.toUpperCase())}
                placeholder="Ex: NDAKO-2026-PROMO"
                className="font-mono font-bold uppercase rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Description ou motif</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 1 publication gratuite pour les nouveaux inscrits"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Nombre max d'utilisations</label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={maxUses}
                  onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Avantage accordé</label>
                <div className="h-10 px-3 flex items-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl font-bold text-emerald-800 dark:text-emerald-300">
                  100% Gratuit (Publication)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Date de début</label>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Date d'expiration</label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Immediate banner toggle */}
            <div className="p-3.5 rounded-xl border border-border bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground block">Publier l'annonce sur la page d'accueil</span>
                <span className="text-[11px] text-muted-foreground">
                  Affiche un bandeau d'alerte spécial informant les visiteurs de ce code
                </span>
              </div>
              <Switch
                checked={publishBannerImmediately}
                onCheckedChange={setPublishBannerImmediately}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePromo}
              className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold"
            >
              Créer le code promotionnel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
