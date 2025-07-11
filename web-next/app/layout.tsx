import '@shopify/polaris/build/esm/styles.css';
import { AppProvider as PolarisAppProvider, Spinner, Frame } from '@shopify/polaris';
import { AppBridgeProvider } from '../providers/AppBridgeProvider';
import './globals.css';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Head from 'next/head';

export const metadata = {
  title: 'Shopify Embedded App',
  description: 'Shopify embedded app with Next.js and Polaris',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 400); // Simulate short loading for UX polish
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <html lang="en">
      <Head>
        <title>Shopify Embedded App</title>
        <meta name="description" content="Shopify embedded app with Next.js and Polaris" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#008060" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <body>
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
      </body>
    </html>
  );
}
