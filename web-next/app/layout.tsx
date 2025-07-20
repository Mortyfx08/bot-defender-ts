import React from 'react';
import '@shopify/polaris/build/esm/styles.css';
import './globals.css';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'Shopify Embedded App',
  description: 'Shopify embedded app with Next.js and Polaris',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const themeColor = '#008060';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
