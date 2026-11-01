import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
type PublicPaymentStatus = { reference: string; listing_id: string | null; amount: number; currency: string; status: 'pending' | 'success' | 'failed'; created_at: string };

export const PaymentReturnPage: React.FC = () => {
  const [params] = useSearchParams();
  const reference = params.get('reference') || '';
  const [transaction, setTransaction] = useState<PublicPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!reference) {
      setLoading(false);
      return;
    }
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const refresh = async () => {
      const { data, error } = await supabase.functions.invoke('get-chariow-payment-status', {
        body: { reference },
      });
      if (!active) return;
      const payment = data?.transaction as PublicPaymentStatus | undefined;
      if (!error && payment) setTransaction(payment);
      setLoading(false);
      attempts += 1;
      if (payment?.status === 'success' || payment?.status === 'failed') {
        if (timer) clearInterval(timer);
      } else if (attempts >= 30) {
        setTimedOut(true);
        if (timer) clearInterval(timer);
      }
    };
    void refresh();
    timer = setInterval(() => { void refresh(); }, 2500);
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [reference]);

  const isSuccess = transaction?.status === 'success';
  const isFailed = transaction?.status === 'failed';

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 sm:p-9 text-center shadow-sm space-y-5">
        {isSuccess ? (
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
        ) : isFailed ? (
          <XCircle className="mx-auto h-16 w-16 text-red-600" />
        ) : (
          <Clock3 className="mx-auto h-16 w-16 text-amber-500" />
        )}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">
            {isSuccess ? 'Paiement confirmé !' : isFailed ? 'Paiement non confirmé' : 'Vérification du paiement'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSuccess
              ? 'Votre paiement a été confirmé par Chariow. Votre annonce est maintenant publiée sur Ndako.'
              : isFailed
              ? 'Chariow nous a signalé que le paiement a échoué ou a été abandonné. Votre annonce n’a pas été publiée.'
              : timedOut
              ? 'La confirmation prend plus de temps que prévu. Ne payez pas une deuxième fois : actualisez cette page dans quelques instants ou contactez notre assistance avec votre référence.'
              : 'Nous attendons la confirmation sécurisée de Chariow. Cette page se met à jour automatiquement.'}
          </p>
        </div>
        {reference && <p className="text-xs text-muted-foreground break-all">Référence : <strong>{reference}</strong></p>}
        {loading && <p className="text-xs text-muted-foreground">Chargement du statut…</p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to={isSuccess && transaction?.listing_id ? `/annonces/${transaction.listing_id}` : '/annonces'}><Button className="w-full bg-[#0F3E6D] hover:bg-[#0A2540] text-white">{isSuccess ? 'Voir mon annonce' : 'Voir les annonces'}</Button></Link>
          <Link to="/"><Button variant="outline" className="w-full">Retour à l’accueil</Button></Link>
        </div>
      </section>
    </main>
  );
};
