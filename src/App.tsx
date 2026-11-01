import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { NavigationTracker } from '@/components/common/NavigationTracker';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <IntersectObserver />
      <NavigationTracker />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow min-w-0">
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" richColors />
    </Router>
  );
};

export default App;
