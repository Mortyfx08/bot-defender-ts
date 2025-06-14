import React from 'react';
import { Page, AppProvider, Loading } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import Dashboard from '../components/Dashboard';

// App Bridge config
const appBridgeConfig = {
  apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || '',
  host: new URLSearchParams(window.location.search).get('host') || '',
  forceRedirect: true
};

export default function App() {
  return (
    <AppBridgeProvider config={appBridgeConfig}>
      <AppProvider i18n={{}}>
        <Page 
          title="Bot Defender"
          subtitle="Protect your store from malicious bots"
        >
          <Dashboard />
        </Page>
      </AppProvider>
    </AppBridgeProvider>
  );
}