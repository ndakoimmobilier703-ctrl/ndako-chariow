import type { ReactNode } from 'react';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { PublishListingPage } from './pages/PublishListingPage';
import { AdminPage } from './pages/AdminPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { PaymentReturnPage } from './pages/PaymentReturnPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Accueil',
    path: '/',
    element: <HomePage />,
    public: true,
  },
  {
    name: 'Annonces',
    path: '/annonces',
    element: <CatalogPage />,
    public: true,
  },
  {
    name: 'Détail Annonce',
    path: '/annonces/:id',
    element: <ListingDetailPage />,
    public: true,
  },
  {
    name: 'Publier une annonce',
    path: '/publier',
    element: <PublishListingPage />,
    public: true,
  },
  {
    name: 'Retour de paiement',
    path: '/paiement/retour',
    element: <PaymentReturnPage />,
    public: true,
  },
  {
    name: 'Espace Administration',
    path: '/admin',
    element: <AdminPage />,
    public: true,
  },
  {
    name: 'Comment ça marche',
    path: '/comment-ca-marche',
    element: <HowItWorksPage />,
    public: true,
  },
  {
    name: 'À propos',
    path: '/a-propos',
    element: <AboutPage />,
    public: true,
  },
];
