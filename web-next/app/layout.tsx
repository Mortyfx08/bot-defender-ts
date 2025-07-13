import React from 'react';
import '@shopify/polaris/build/esm/styles.css';
import './globals.css';
import Head from 'next/head';
import ClientLayout from './ClientLayout';

export const metadata = {
  title: 'Shopify Embedded App',
  description: 'Shopify embedded app with Next.js and Polaris',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
