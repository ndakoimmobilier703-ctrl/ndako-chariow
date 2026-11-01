import React, { useState, useEffect } from 'react';
import type { ListingReview } from '@/types';
import { ReviewService } from '@/services/reviewService';
import {
  MessageSquare,
  Star,
  Flag,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  ShieldCheck,
  User,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'reported' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadReviews = async () => {
    setLoading(true);
    const all = await ReviewService.getAllReviews();
    setReviews(all);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    await ReviewService.moderateReview(id, action);
    toast.success(
      status === 'approved'
        ? 'Avis validé et approuvé pour parution publique.'
        : 'Avis rejeté et masqué de la consultation.'
    );
    loadReviews();
  };

  const handleDelete = async (id: string, author: string) => {
    if (window.confirm(`Supprimer définitivement l'avis déposé par ${author} ?`)) {
      await ReviewService.deleteReview(id);
      toast.success('Avis supprimé définitivement.');
      loadReviews();
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterStatus === 'reported' && !r.is_reported) return false;
    if (filterStatus === 'approved' && r.status !== 'approved') return false;
    if (filterStatus === 'rejected' && r.status !== 'rejected') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.author_name.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.report_reason && r.report_reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const reportedCount = reviews.filter((r) => r.is_reported).length;
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0F3E6D] dark:text-blue-400" />
            <h2 className="text-xl font-black text-foreground">Modération des Avis & Commentaires</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gérez les avis authentiques déposés par les locataires, surveillez les signalements et protégez la plateforme contre les abus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadReviews}
            disabled={loading}
            className="rounded-xl text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Total Avis Enregistrés</div>
          <div className="text-2xl font-black text-foreground mt-1">{reviews.length}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Données réelles sans faux avis</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Note Moyenne Globale</div>
          <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <span>{averageRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-500 inline" />
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Sur l'ensemble des annonces</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Avis Signalés</div>
          <div className={`text-2xl font-black mt-1 ${reportedCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {reportedCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {reportedCount > 0 ? 'Attention requise' : 'Aucun signalement en attente'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase">Avis Approuvés</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {reviews.filter((r) => r.status === 'approved').length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Visibles sur le site</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par auteur, texte..."
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
            <SelectTrigger className="w-full sm:w-48 bg-card rounded-xl text-xs">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les avis ({reviews.length})</SelectItem>
              <SelectItem value="reported">Signalés uniquement ({reportedCount})</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés / Masqués</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Liste des avis soumis
          </h3>
          <span className="text-xs text-muted-foreground">{filteredReviews.length} avis affichés</span>
        </div>

        <div className="w-full max-w-full overflow-x-auto bg-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                <th className="p-3.5 whitespace-nowrap">Auteur & Date</th>
                <th className="p-3.5 whitespace-nowrap">Note</th>
                <th className="p-3.5 whitespace-nowrap">Commentaire</th>
                <th className="p-3.5 whitespace-nowrap">Statut & Signalement</th>
                <th className="p-3.5 whitespace-nowrap text-right">Actions de modération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucun avis trouvé correspondant à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center font-bold text-xs text-[#0F3E6D] shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{rev.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(rev.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <span>{rev.rating}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      </div>
                    </td>

                    <td className="p-3.5 max-w-md">
                      <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                        {rev.comment}
                      </p>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        {rev.is_reported ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-bold text-[11px]">
                            <Flag className="w-3 h-3 text-red-600" />
                            <span>Signalé : {rev.report_reason || 'Contenu suspect'}</span>
                          </div>
                        ) : rev.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approuvé</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px]">
                            <span>Rejeté / Masqué</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(rev.id, 'approved')}
                            className="rounded-xl text-[11px] h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          >
                            Approuver
                          </Button>
                        )}
                        {rev.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                            className="rounded-xl text-[11px] h-8 text-amber-700 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                          >
                            Masquer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(rev.id, rev.author_name)}
                          className="rounded-xl text-[11px] h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
