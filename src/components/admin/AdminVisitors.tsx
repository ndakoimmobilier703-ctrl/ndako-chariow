import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import type { VisitorDailyStat, VisitorHourlyStat, VisitorCountryStat } from '@/types';
import {
  Users,
  Globe2,
  Clock,
  Calendar,
  Activity,
  ShieldCheck,
  RefreshCw,
  Info,
  BarChart3,
  UserCheck,
  Repeat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminVisitors: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [hasData, setHasData] = useState<boolean>(false);
  const [periodLabel, setPeriodLabel] = useState<string>('');
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [repeatedVisits, setRepeatedVisits] = useState<number>(0);
  const [dailyStats, setDailyStats] = useState<VisitorDailyStat[]>([]);
  const [hourlyStats, setHourlyStats] = useState<VisitorHourlyStat[]>([]);
  const [countryStats, setCountryStats] = useState<VisitorCountryStat[]>([]);

  const loadData = async (selectedPeriod = period, silent = false) => {
    if (!silent) setLoading(true);
    const res = await analyticsService.getVisitorStats(selectedPeriod);
    setHasData(res.has_data);
    setPeriodLabel(res.period_label);
    setTotalVisits(res.total_visits);
    setUniqueVisitors(res.unique_visitors);
    setRepeatedVisits(res.repeated_visits);
    setDailyStats(res.daily_stats);
    setHourlyStats(res.hourly_stats);
    setCountryStats(res.country_stats);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    loadData(period, false);

    // Synchronisation en direct chaque seconde
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

  // Compute peak hour if hourlyStats available
  const peakHourObj = hourlyStats.reduce(
    (max, cur) => (cur.visits > max.visits ? cur : max),
    { hour: 0, visits: 0 }
  );

  const topCountryObj = countryStats[0];

  const maxDaily = Math.max(...dailyStats.map((d) => d.total_visits), 10);
  const maxHourly = Math.max(...hourlyStats.map((h) => h.visits), 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0F3E6D] dark:text-blue-400" />
            <h2 className="text-xl font-black text-foreground">Gestion & Fréquentation des Visiteurs</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Données <strong>strictement réelles</strong> collectées sur le site. Aucune simulation ni donnée fictive.
          </p>
        </div>

        {/* Filter Period Buttons */}
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
              Tout l'historique
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

      {/* KPI Cards (Always showing real numbers) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase">Total Visites</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {totalVisits.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Période : {periodLabel}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase">Visiteurs Uniques</span>
            <UserCheck className="w-4 h-4 text-[#0F3E6D] dark:text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {uniqueVisitors.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Identifiants réels distincts
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase">Visites Répétées</span>
            <Repeat className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {repeatedVisits.toLocaleString('fr-FR')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Sessions récurrentes
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase">Heure de Pointe</span>
            <Clock className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground">
            {peakHourObj.visits > 0 ? `${peakHourObj.hour}h00` : '—'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {peakHourObj.visits > 0 ? `${peakHourObj.visits} visites enregistrées` : 'En attente de visites'}
          </div>
        </div>
      </div>

      {/* Empty State vs Real Data */}
      {!hasData ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-border text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto text-[#0F3E6D] dark:text-blue-400">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-foreground">Aucune visite enregistrée pour cette période</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Le système de collecte réelle est actif. Dès que des utilisateurs navigueront sur le site, leurs visites, heures d'affluence et pays d'origine seront automatiquement enregistrés et affichés ici sans aucune extrapolation fictive.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Collecte conforme et respectueuse de la vie privée</span>
          </div>
        </div>
      ) : (
        <>
          {/* Main Grid: Daily Frequency Chart & Hourly Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Evolution */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0F3E6D] dark:text-blue-400" />
                    <span>Fréquentation quotidienne réelle</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Volume de visites jour par jour</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0F3E6D]" /> Visites totales
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Visiteurs uniques
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-56 flex items-end justify-between gap-2 pt-6 border-b border-border">
                {dailyStats.map((item, idx) => {
                  const heightPercent = Math.max(8, Math.round((item.total_visits / maxDaily) * 100));
                  const uniquePercent = Math.max(4, Math.round((item.unique_visitors / maxDaily) * 100));
                  const d = new Date(item.date);
                  const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <span className="font-bold">{item.date}</span> : {item.total_visits} visites ({item.unique_visitors} uniques)
                      </div>

                      <div className="w-full max-w-[36px] flex items-end justify-center gap-0.5 h-full">
                        <div
                          className="w-1/2 bg-[#0F3E6D] rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <div
                          className="w-1/2 bg-amber-400 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                          style={{ height: `${uniquePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Geographical Distribution by Country */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-emerald-600" />
                    <span>Répartition par pays réelle</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Estimation par fuseau & IP</p>
                </div>
              </div>

              <div className="space-y-3.5 mt-4">
                {countryStats.map((c, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <span>{c.flag}</span>
                        <span>{c.country}</span>
                      </span>
                      <span className="text-muted-foreground">
                        {c.visits} visites (<strong>{c.percentage}%</strong>)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hourly Distribution Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F97316]" />
                  <span>Activité horaire sur la journée (00h à 23h)</span>
                </h3>
                <p className="text-xs text-muted-foreground">Identification des pics de trafic réels</p>
              </div>
            </div>

            <div className="h-40 flex items-end justify-between gap-1 pt-6 border-b border-border">
              {hourlyStats.map((h) => {
                const heightPercent = Math.max(4, Math.round((h.visits / maxHourly) * 100));
                const isPeak = h.hour === peakHourObj.hour && h.visits > 0;

                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {h.hour}h : {h.visits} visites
                    </div>
                    <div
                      className={`w-full max-w-[14px] rounded-t-sm transition-all duration-200 ${
                        isPeak ? 'bg-[#F97316]' : 'bg-slate-300 dark:bg-slate-700 hover:bg-[#0F3E6D]'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground mt-2">
                      {h.hour % 3 === 0 ? `${h.hour}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-border flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong>Garantie d'intégrité Ndako :</strong> Toutes les données présentées ci-dessus sont issues de sessions effectives d'utilisateurs. Les adresses IP et identifiants techniques sont anonymisés pour respecter scrupuleusement la confidentialité des visiteurs conformément aux réglementations de protection des données.
        </div>
      </div>
    </div>
  );
};
