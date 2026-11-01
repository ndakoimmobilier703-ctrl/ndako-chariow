import React, { useState, useEffect } from 'react';
import type { ListingReview } from '@/types';
import { ReviewService } from '@/services/reviewService';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Send,
  Flag,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ReviewSectionProps {
  listingId: string;
  listingTitle: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ listingId, listingTitle }) => {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Form State
  const [authorName, setAuthorName] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Report Modal State
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [isReporting, setIsReporting] = useState<boolean>(false);

  const loadReviews = async () => {
    setLoading(true);
    const data = await ReviewService.getReviewsByListing(listingId);
    setReviews(data.reviews);
    setAverageRating(data.averageRating);
    setTotalCount(data.totalCount);
    setLoading(false);
  };

  useEffect(() => {
    if (listingId) {
      loadReviews();
    }
  }, [listingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      toast.error('Veuillez saisir votre nom ou prénom.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      toast.error('Votre commentaire doit comporter au moins 5 caractères.');
      return;
    }

    setIsSubmitting(true);
    const res = await ReviewService.submitReview({
      listingId,
      authorName,
      rating,
      comment,
    });
    setIsSubmitting(false);

    if (res.success) {
      toast.success(res.message);
      setComment('');
      setRating(5);
      loadReviews();
    } else {
      toast.error(res.message);
    }
  };

  const handleReport = async () => {
    if (!reportingReviewId) return;
    setIsReporting(true);
    const res = await ReviewService.reportReview(reportingReviewId, reportReason);
    setIsReporting(false);
    toast.success(res.message);
    setReportingReviewId(null);
    setReportReason('');
  };

  return (
    <div className="space-y-6 pt-6 border-t border-border" id="section-avis">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#0F3E6D] dark:text-blue-400" />
            <span>Avis et commentaires des locataires ({totalCount})</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retours d'expérience authentiques vérifiés par Ndako.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900 self-start sm:self-auto">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {averageRating} / 5
            </span>
          </div>
        )}
      </div>

      {/* Review Submission Form */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-border space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
          <Star className="w-4 h-4 text-[#F97316]" />
          Laisser un avis sur ce bien
        </h4>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Votre nom ou prénom *</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Ex: Michel D., Sandra M."
                className="bg-white dark:bg-slate-900 rounded-xl text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Votre note *</label>
              <div className="flex items-center gap-1.5 h-10 px-3 bg-white dark:bg-slate-900 rounded-xl border border-border">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-muted-foreground ml-2">
                  {rating} / 5 étoiles
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Votre commentaire d'expérience *</label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience : état du logement, localisation, réactivité du bailleur, conformité des photos..."
              className="bg-white dark:bg-slate-900 rounded-xl text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Protection anti-XSS et contrôle anti-doublon actifs
            </span>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0F3E6D] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Publication...' : 'Publier mon avis'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Chargement des avis...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-border p-6 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-foreground">Aucun avis pour le moment</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Soyez le premier à partager votre expérience de visite ou de location pour ce logement !
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-border shadow-xs space-y-2.5 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#0F3E6D] dark:text-blue-400 font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-foreground">{rev.author_name}</h5>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span>{new Date(rev.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">Visiteur vérifié</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        className={`w-3.5 h-3.5 ${
                          st <= rev.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setReportingReviewId(rev.id)}
                    title="Signaler cet avis"
                    className="p-1 rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed pl-10">
                {rev.comment}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Reporting Dialog */}
      <Dialog open={!!reportingReviewId} onOpenChange={(open) => !open && setReportingReviewId(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Signaler un avis inapproprié
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Veuillez préciser le motif de signalement (propos déplacés, faux avis, tentative d'arnaque, spam) :
            </p>
            <Textarea
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Expliquez la raison du signalement..."
              className="rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportingReviewId(null)}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleReport}
              disabled={isReporting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              {isReporting ? 'Envoi...' : 'Confirmer le signalement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
