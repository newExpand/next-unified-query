"use client";

import { useEffect } from 'react';
import { setupCSPReporting } from '@/lib/security-monitoring';

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize CSP violation reporting
    setupCSPReporting();
    
    // Log page views for security monitoring (in production)
    if (process.env.NODE_ENV === 'production') {
      // This would be replaced with actual analytics/monitoring service
      console.log('[Security] Page view logged');
    }
  }, []);

  return <>{children}</>;
}