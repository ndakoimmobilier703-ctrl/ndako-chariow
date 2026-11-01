import React from 'react';
import { Link } from 'react-router-dom';
import { NdakoLogo } from './NdakoLogo';
import { ShieldAlert, MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A2540] text-slate-200 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="bg-white/10 p-2.5 rounded-xl inline-block backdrop-blur-xs">
              <NdakoLogo size="md" clickable={true} />
            </div>
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              La plateforme immobilière internationale de référence pour louer des maisons, appartements, studios et bureaux en toute sérénité.
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F97316]" /> Afrique & International
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#F97316]" /> +242 06 543 2190
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/annonces" className="text-slate-300 hover:text-white transition-colors">
                  Toutes les annonces
                </Link>
              </li>
              <li>
                <Link to="/publier" className="text-slate-300 hover:text-white transition-colors">
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link to="/comment-ca-marche" className="text-slate-300 hover:text-white transition-colors">
                  Comment ça marche ?
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-slate-300 hover:text-white transition-colors">
                  À propos de Ndako
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Countries (strictly the 5 authorized countries) */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Pays disponibles</h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li>
                <Link to="/annonces?country=Congo" className="hover:text-white transition-colors">
                  🇨🇬 Congo (Brazzaville, Pointe-Noire)
                </Link>
              </li>
              <li>
                <Link to="/annonces?country=Cote+d+Ivoire" className="hover:text-white transition-colors">
                  🇨🇮 Côte d'Ivoire (Abidjan)
                </Link>
              </li>
              <li>
                <Link to="/annonces?country=Senegal" className="hover:text-white transition-colors">
                  🇸🇳 Sénégal (Dakar)
                </Link>
              </li>
              <li>
                <Link to="/annonces?country=Cameroun" className="hover:text-white transition-colors">
                  🇨🇲 Cameroun (Yaoundé, Douala)
                </Link>
              </li>
              <li>
                <Link to="/annonces?country=Benin" className="hover:text-white transition-colors">
                  🇧🇯 Bénin (Cotonou, Porto-Novo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Anti-fraud commitment */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4 flex items-center gap-1.5 text-amber-400">
              <ShieldAlert className="w-4 h-4" /> Sécurité & Vigilance
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-3.5 rounded-xl border border-amber-400/30">
              Ne versez <strong>jamais</strong> d'argent ou d'avance de caution sans avoir visité le logement en personne et vérifié l'identité du bailleur.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Ndako. Tous droits réservés. Plateforme immobilière internationale.</p>
          <div className="flex items-center gap-4">
            <span>Sécurité garantie</span>
            <span>•</span>
            <span>Mobile Money & Carte</span>
            <span>•</span>
            <span>Contact direct propriétaire</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
