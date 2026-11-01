import { supabase } from '@/db/supabase';
import type { ListingReview } from '@/types';
import { analyticsService } from '@/services/analyticsService';

const STORAGE_KEY_REVIEWS = 'ndako_listing_reviews_v1';

export class ReviewService {
  /**
   * Helper to retrieve local reviews cache/fallback
   */
  private static getLocalReviews(): ListingReview[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  }

  private static saveLocalReviews(reviews: ListingReview[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }

  /**
   * Fetch approved reviews for a specific listing
   */
  static async getReviewsByListing(listingId: string): Promise<{
    reviews: ListingReview[];
    averageRating: number;
    totalCount: number;
  }> {
    let list: ListingReview[] = [];

    try {
      const { data, error } = await supabase
        .from('listing_reviews')
        .select('*')
        .eq('listing_id', listingId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        list = data as ListingReview[];
      } else {
        list = this.getLocalReviews().filter(
          (r) => r.listing_id === listingId && r.status === 'approved'
        );
      }
    } catch {
      list = this.getLocalReviews().filter(
        (r) => r.listing_id === listingId && r.status === 'approved'
      );
    }

    const totalCount = list.length;
    const averageRating =
      totalCount > 0
        ? Number((list.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1))
        : 0;

    return { reviews: list, averageRating, totalCount };
  }

  /**
   * Submit a new review with anti-abuse, anti-duplicate and XSS sanitization
   */
  static async submitReview(params: {
    listingId: string;
    authorName: string;
    rating: number;
    comment: string;
  }): Promise<{ success: boolean; message: string; review?: ListingReview }> {
    const { listingId, authorName, rating, comment } = params;

    // 1. Validation
    if (!authorName.trim()) {
      return { success: false, message: 'Veuillez saisir votre nom ou pseudo.' };
    }
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, message: 'Veuillez attribuer une note entre 1 et 5 étoiles.' };
    }
    if (!comment.trim() || comment.trim().length < 5) {
      return { success: false, message: 'Le commentaire doit comporter au moins 5 caractères.' };
    }

    // 2. Anti-XSS Sanitization
    const sanitizedComment = comment
      .replace(/<[^>]*>?/gm, '') // Strip HTML tags
      .replace(/javascript:/gi, '')
      .trim();

    const sanitizedName = authorName.replace(/<[^>]*>?/gm, '').trim();

    const visitorId = analyticsService.getVisitorId();

    // 3. Anti-duplicate check
    const localList = this.getLocalReviews();
    const existing = localList.find(
      (r) => r.listing_id === listingId && r.visitor_id === visitorId
    );
    if (existing) {
      return {
        success: false,
        message: 'Vous avez déjà partagé un avis sur ce bien immobilier.',
      };
    }

    const newReview: ListingReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      listing_id: listingId,
      author_name: sanitizedName,
      rating,
      comment: sanitizedComment,
      is_reported: false,
      status: 'approved',
      visitor_id: visitorId,
      created_at: new Date().toISOString(),
    };

    // Save locally
    localList.unshift(newReview);
    this.saveLocalReviews(localList);

    // Save to Supabase
    try {
      await supabase.from('listing_reviews').insert([
        {
          id: newReview.id,
          listing_id: listingId,
          author_name: sanitizedName,
          rating,
          comment: sanitizedComment,
          is_reported: false,
          status: 'approved',
          visitor_id: visitorId,
        },
      ]);
    } catch {
      // Local fallback covers it
    }

    return {
      success: true,
      message: 'Votre avis a été publié avec succès. Merci pour votre retour !',
      review: newReview,
    };
  }

  /**
   * Report an inappropriate review
   */
  static async reportReview(
    reviewId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const localList = this.getLocalReviews();
    const target = localList.find((r) => r.id === reviewId);
    if (target) {
      target.is_reported = true;
      target.report_reason = reason || 'Signalé par un utilisateur';
      this.saveLocalReviews(localList);
    }

    try {
      await supabase
        .from('listing_reviews')
        .update({ is_reported: true, report_reason: reason })
        .eq('id', reviewId);
    } catch {
      // ignore
    }

    return {
      success: true,
      message: 'Merci. Cet avis a été signalé pour modération par l\'équipe Ndako.',
    };
  }

  /**
   * Get all reviews requiring moderation (for Admin)
   */
  static async getModerationReviews(): Promise<ListingReview[]> {
    try {
      const { data, error } = await supabase
        .from('listing_reviews')
        .select('*')
        .or('is_reported.eq.true,status.eq.pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as ListingReview[];
      }
    } catch {
      // fallback
    }

    return this.getLocalReviews().filter((r) => r.is_reported || r.status === 'pending');
  }

  /**
   * Get all reviews in the system (for Admin dashboard)
   */
  static async getAllReviews(): Promise<ListingReview[]> {
    try {
      const { data, error } = await supabase
        .from('listing_reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ListingReview[];
      }
    } catch {
      // fallback
    }

    return this.getLocalReviews();
  }

  /**
   * Delete review directly
   */
  static async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    return this.moderateReview(reviewId, 'delete');
  }

  /**
   * Moderate review (Approve, Reject or Delete)
   */
  static async moderateReview(
    reviewId: string,
    action: 'approve' | 'reject' | 'delete'
  ): Promise<{ success: boolean; message: string }> {
    const localList = this.getLocalReviews();

    if (action === 'delete') {
      const filtered = localList.filter((r) => r.id !== reviewId);
      this.saveLocalReviews(filtered);
      try {
        await supabase.from('listing_reviews').delete().eq('id', reviewId);
      } catch {
        // ignore
      }
      return { success: true, message: 'Avis supprimé définitivement.' };
    }

    const target = localList.find((r) => r.id === reviewId);
    if (target) {
      target.is_reported = false;
      target.status = action === 'approve' ? 'approved' : 'rejected';
      this.saveLocalReviews(localList);
    }

    try {
      await supabase
        .from('listing_reviews')
        .update({
          is_reported: false,
          status: action === 'approve' ? 'approved' : 'rejected',
        })
        .eq('id', reviewId);
    } catch {
      // ignore
    }

    return {
      success: true,
      message: action === 'approve' ? 'Avis approuvé et rétabli.' : 'Avis rejeté.',
    };
  }
}
