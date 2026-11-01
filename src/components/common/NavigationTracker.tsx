import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '@/services/analyticsService';

export const NavigationTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Record page view on location change
    analyticsService.recordPageView(location.pathname);
  }, [location.pathname]);

  return null;
};
