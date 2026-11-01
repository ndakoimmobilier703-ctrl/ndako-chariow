import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NdakoLogo } from './NdakoLogo';
import { PlusCircle, Menu, X, Home, Search, HelpCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { listingService } from '@/services/listingService';
import { analyticsService } from '@/services/analyticsService';
import type { PlatformSettings } from '@/types';

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    listingService.getPlatformSettings().then(setPlatformSettings);
  }, [location.pathname]);

  const canPublish = platformSettings?.allow_public_listings !== false;

  const navLinks = [
    { label: 'Accueil', path: '/' },
    { label: 'Annonces', path: '/annonces' },
    { label: 'Comment ça marche ?', path: '/comment-ca-marche' },
    { label: 'À propos', path: '/a-propos' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo - Secret triple-click opens /admin */}
        <NdakoLogo size="md" showTagline={false} />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`transition-colors py-1.5 border-b-2 font-medium ${
                isActive(link.path)
                  ? 'text-[#0F3E6D] dark:text-blue-300 border-[#0F3E6D] font-bold'
                  : 'text-foreground/80 hover:text-[#0F3E6D] border-transparent'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Group */}
        <div className="flex items-center gap-3">
          {/* Primary CTA: Publier une annonce (Masqué si désactivé par l'administrateur) */}
          {canPublish && (
            <Link
              to="/publier"
              onClick={() =>
                analyticsService.recordInteraction(
                  'btn_header_publish',
                  'Publier une annonce (En-tête)',
                  'publish',
                  location.pathname,
                  'Dépôt d\'annonce immobilière'
                )
              }
            >
              <Button
                className="bg-[#F97316] hover:bg-[#EA580C] text-white font-medium px-3 sm:px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 sm:gap-2 border-0 text-xs sm:text-sm"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Publier une annonce</span>
                <span className="sm:hidden">Publier</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu Sheet */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="mb-6 text-left">
                    <SheetTitle>
                      <NdakoLogo size="sm" />
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        className={`px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive(link.path)
                            ? 'bg-[#0F3E6D]/10 text-[#0F3E6D] font-bold'
                            : 'text-foreground hover:bg-muted font-medium'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                {canPublish && (
                  <div className="mt-8 pt-4 border-t border-border">
                    <Link
                      to="/publier"
                      onClick={() => {
                        setMobileOpen(false);
                        analyticsService.recordInteraction(
                          'btn_mobile_menu_publish',
                          'Publier une annonce (Menu Mobile)',
                          'publish',
                          location.pathname,
                          'Dépôt d\'annonce immobilière'
                        );
                      }}
                      className="w-full block"
                    >
                      <Button className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white font-medium py-3 rounded-xl">
                        Publier une annonce
                      </Button>
                    </Link>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
