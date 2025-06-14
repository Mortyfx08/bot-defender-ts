import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './pages/App';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import '@shopify/polaris/build/esm/styles.css';

const appBridgeConfig = {
  apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || '',
  host: new URLSearchParams(window.location.search).get('host') || '',
  forceRedirect: true
};

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

// Create a wrapper component to handle the redirect
const AppWrapper = () => {
  const app = useAppBridge();
  
  React.useEffect(() => {
    if (!appBridgeConfig.host) {
      const redirect = Redirect.create(app);
      redirect.dispatch(Redirect.Action.REMOTE, '/auth');
    }
  }, [app]);

  return <App />;
};

root.render(
  <AppProvider i18n={{}}>
    <AppBridgeProvider config={appBridgeConfig}>
      <AppWrapper />
    </AppBridgeProvider>
  </AppProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

