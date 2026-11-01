import React from 'react';
import { NdakoLogo } from '@/components/common/NdakoLogo';
import { ShieldCheck, Globe, Users, HeartHandshake, Phone, Mail } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <NdakoLogo size="lg" clickable={false} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            À propos de Ndako
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            La plateforme immobilière internationale créée pour simplifier et sécuriser la location de maisons et d'appartements en Afrique et au-delà.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-border shadow-xs space-y-6 text-foreground leading-relaxed">
          <h2 className="text-xl font-black text-foreground">Notre Vision</h2>
          <p className="text-sm text-foreground/80 leading-relaxed">
            « Ndako » signifie la maison. Notre ambition est de permettre à chaque famille, étudiant, professionnel ou expatrié de trouver un logement de qualité, sans intermédiaire frauduleux et dans une transparence totale.
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Que vous soyez au Congo, en Côte d'Ivoire, au Sénégal, au Cameroun ou au Bénin, Ndako connecte directement les locataires avec des propriétaires et agents réputés grâce aux technologies modernes (contact WhatsApp instantané, géolocalisation et vérification des annonces).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border">
            <div className="space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
              <h3 className="font-bold text-sm text-foreground">Vigilance anti-fraude</h3>
              <p className="text-xs text-muted-foreground">
                Avertissement obligatoire avant tout appel pour empêcher les arnaques de caution préalable.
              </p>
            </div>

            <div className="space-y-2">
              <Globe className="w-8 h-8 text-[#0F3E6D]" />
              <h3 className="font-bold text-sm text-foreground">Envergure internationale</h3>
              <p className="text-xs text-muted-foreground">
                Déploiement multi-pays avec monnaie locale en FCFA et détection géographique intelligente.
              </p>
            </div>

            <div className="space-y-2">
              <HeartHandshake className="w-8 h-8 text-[#F97316]" />
              <h3 className="font-bold text-sm text-foreground">Contact direct & simple</h3>
              <p className="text-xs text-muted-foreground">
                Pas de commission cachée. Vous échangez librement avec le propriétaire du bien.
              </p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-border text-center text-xs text-muted-foreground space-y-2">
          <div className="font-bold text-foreground">Contact & Assistance Ndako</div>
          <div>Brazzaville, République du Congo • Support WhatsApp : +242 06 543 2190</div>
          <div>Email : contact@ndako.immo</div>
        </div>
      </div>
    </div>
  );
};
