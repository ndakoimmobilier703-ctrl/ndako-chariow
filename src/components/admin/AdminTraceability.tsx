import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import type { PageVisitStat, ButtonClickStat, NavigationFunnelStep, UserExitStat } from '@/types';
import {
  MousePointerClick,
  FileText,
  Filter,
  PhoneCall,
  MessageCircle,
  PlusCircle,
  Eye,
  RefreshCw,
  Info,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Star,
  Tag,
  Heart,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminTraceability: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [hasData, setHasData] = useState<boolean>(false);
  const [totalEvents, setTotalEvents] = useState<number>(0);
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [pages, setPages] = useState<PageVisitStat[]>([]);
  const [buttons, setButtons] = useState<ButtonClickStat[]>([]);
  const [funnel, setFunnel] = useState<NavigationFunnelStep[]>([]);
  const [exits, setExits] = useState<UserExitStat[]>([]);

  const loadData = async (selectedPeriod = period, silent = false) => {
    if (!silent) setLoading(true);
    const res = await analyticsService.getTraceabilityStats(selectedPeriod);
    setHasData(res.has_data);
    setTotalEvents(res.total_events);
    setPeriodLabel(res.period_label);
    setPages(res.popular_pages);
    setButtons(res.button_clicks);
    setFunnel(res.funnel);
    setExits(res.exit_stats);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    loadData(period, false);

    // Actualisation automatique chaque seconde sans rechargement complet de la page
    const timer = setInterval(() => {
      if (isMounted) {
        loadData(period, true);
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [period]);

  const getCategoryIcon = (category: ButtonClickStat['category']) => {
    switch (category) {
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600" />;
      case 'publish':
        return <PlusCircle className="w-3.5 h-3.5 text-[#F97316]" />;
      case 'filter':
        return <Filter className="w-3.5 h-3.5 text-purple-600" />;
      case 'review':
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'promo':
        return <Tag className="w-3.5 h-3.5 text-pink-600" />;
      case 'favorite':
        return <Heart className="w-3.5 h-3.5 text-rose-500" />;
      case 'navigation':
        return <Compass className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-[#0F3E6D] dark:text-blue-400" />
            <h2 className="text-xl font-black text-foreground">Traçabilité & Comportement des Utilisateurs</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enregistrement des interactions réelles, clics WhatsApp/Appels, pages consultées et parcours de navigation.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Direct 1s</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-border">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'today'
                  ? 'bg-white dark:bg-slate-900 text-[#0F3E6D] dark:text-blue-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === '7d'
                  ? 'bg-white dark:bg-slate-900 text-[#0F3E6D] dark:text-blue-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              7 jours
            </button>
            <button
              type="button"
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === '30d'
                  ? 'bg-white dark:bg-slate-900 text-[#0F3E6D] dark:text-blue-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              30 jours
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === 'all'
                  ? 'bg-white dark:bg-slate-900 text-[#0F3E6D] dark:text-blue-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tout
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(period)}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Real Events KPI Counter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Événements Réels</div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">{totalEvents.toLocaleString('fr-FR')}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Interactions & Vues</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Boutons Déclenchés</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {buttons.reduce((sum, b) => sum + b.click_count, 0).toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Actions utilisateurs</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Consultations Pages</div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F3E6D] dark:text-blue-400">
            {pages.reduce((sum, p) => sum + p.views, 0).toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Sur l'ensemble du site</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="text-xs font-bold uppercase text-muted-foreground mb-1">Période Active</div>
          <div className="text-lg font-bold text-foreground truncate">{periodLabel}</div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% données réelles
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-border text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center mx-auto text-amber-600">
            <Activity className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-foreground">Aucune interaction enregistrée pour cette période</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Le suivi de traçabilité est actif. Dès que des visiteurs cliqueront sur WhatsApp, appelleront un bailleur, ajouteront aux favoris ou changeront de page, chaque action réelle apparaîtra immédiatement ici avec son horodatage exact.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Real Buttons Click Ranking & Pages Visited */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real Buttons Clicks & Actions Table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-[#F97316]" />
                    <span>Boutons et fonctionnalités les plus utilisés</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Statistiques réelles : clics, actions finalisées et fonctionnalités associées
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 self-start sm:self-auto">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Actualisation 1s active</span>
                </div>
              </div>

              {buttons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Aucune interaction de bouton enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {buttons.map((btn, idx) => (
                    <div
                      key={btn.button_id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 border border-border shadow-2xs mt-0.5">
                          {getCategoryIcon(btn.category)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-foreground truncate">{btn.button_label}</h4>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-[10px] font-semibold text-[#0F3E6D] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                              {btn.feature_name || 'Fonctionnalité générale'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Dernier : {btn.last_clicked_at}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60 justify-between sm:justify-end">
                        <div className="text-center sm:text-right">
                          <span className="text-xs sm:text-sm font-black text-foreground block">
                            {btn.click_count.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">clics réels</span>
                        </div>

                        <div className="text-center sm:text-right">
                          <span className="text-xs sm:text-sm font-black text-emerald-600 block">
                            {btn.action_count.toLocaleString('fr-FR')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">actions faites</span>
                        </div>

                        {btn.conversion_rate !== undefined && (
                          <div className="text-center sm:text-right pl-2 border-l border-border">
                            <span className="text-xs sm:text-sm font-black text-[#0F3E6D] dark:text-blue-400 block">
                              {btn.conversion_rate}%
                            </span>
                            <span className="text-[10px] text-muted-foreground">succès</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Visited Pages Table */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#0F3E6D] dark:text-blue-400" />
                    <span>Pages les plus consultées</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Vues réelles et temps estimé</p>
                </div>
              </div>

              {pages.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Aucune page visitée enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {pages.map((p, idx) => (
                    <div
                      key={p.path || idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-foreground truncate">{p.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.path}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-foreground">{p.views.toLocaleString('fr-FR')}</span>
                        <span className="text-[10px] text-muted-foreground block">vues</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real Conversion Funnel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Entonnoir de navigation et conversion réel</span>
                </h3>
                <p className="text-xs text-muted-foreground">Progression réelle des utilisateurs au fil de leur visite</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {funnel.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border relative flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#0F3E6D] dark:text-blue-400">
                      {step.step}
                    </span>
                    <h4 className="text-xs font-bold text-foreground mt-1 line-clamp-2">{step.label}</h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between">
                    <span className="text-lg font-black text-foreground">{step.visitors}</span>
                    <span className="text-xs font-bold text-emerald-600">{step.conversion_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-950 dark:text-blue-300 leading-relaxed flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          Les événements sont enregistrés dès que l'internaute interagit avec un composant du site (appel, WhatsApp, publication, favoris, filtre). Ces métriques permettent d'optimiser le placement des boutons et la navigation globale.
        </div>
      </div>
    </div>
  );
};
