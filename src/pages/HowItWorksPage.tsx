import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  ShieldAlert,
  PlusCircle,
  CreditCard,
  CheckCircle,
  Home,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Comment fonctionne Ndako ?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Un guide clair et transparent pour louer ou proposer un logement en toute sécurité et sans mauvaise surprise.
          </p>
        </div>

        {/* Section 1: Pour les locataires */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-border shadow-xs space-y-8">
          <div className="border-b border-border pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Chercheurs de logement
            </span>
            <h2 className="text-2xl font-black text-foreground mt-1">Vous cherchez un logement à louer</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0F3E6D] dark:text-blue-300 flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Recherchez et filtrez</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Utilisez les critères géographiques (pays, ville, quartier) et les filtres (type, loyer, équipements) pour trouver le bien idéal.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Contactez directement sur WhatsApp</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Échangez directement avec le bailleur ou l'agent en un clic sur le bouton WhatsApp avec message prérempli.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Visitez avant tout paiement</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Appliquez notre règle d'or : visitez le logement en personne et vérifiez l'identité du bailleur avant toute transaction de caution.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Pour les propriétaires & agents */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-border shadow-xs space-y-8">
          <div className="border-b border-border pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F3E6D]">
              Bailleurs & Agences
            </span>
            <h2 className="text-2xl font-black text-foreground mt-1">Vous souhaitez publier une annonce</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-foreground">Remplissez le formulaire</h4>
              <p className="text-xs text-muted-foreground">
                Détaillez le type de bien, surface, équipements et téléversez jusqu'à 12 photos.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-foreground">Indiquez loyer & contact</h4>
              <p className="text-xs text-muted-foreground">
                Précisez le montant en FCFA/devise et vos numéros WhatsApp et téléphone direct.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-foreground">Choisissez la durée</h4>
              <p className="text-xs text-muted-foreground">
                1 semaine (500 F), 2 semaines (1 000 F) ou 1 mois (3 000 F) (ou gratuit si activé).
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-foreground">Publication instantanée</h4>
              <p className="text-xs text-muted-foreground">
                Votre annonce est visible par des milliers de locataires potentiels.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-center">
            <Link to="/publier">
              <Button className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-8 py-3 rounded-xl shadow-md">
                <span>Publier mon logement maintenant</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
