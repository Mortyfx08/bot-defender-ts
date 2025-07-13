'use client';

import { AppProvider as PolarisAppProvider, Spinner, Frame } from '@shopify/polaris';
import { AppBridgeProvider } from '../providers/AppBridgeProvider';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <PolarisAppProvider i18n={{}}>
      <AppBridgeProvider>
        <Frame>
          {loading && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255,255,255,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner accessibilityLabel="Loading page" size="large" />
            </div>
          )}
          {children}
        </Frame>
      </AppBridgeProvider>
    </PolarisAppProvider>
  );
} 