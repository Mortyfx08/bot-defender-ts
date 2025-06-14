import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import App from './App';
import enTranslations from '@shopify/polaris/locales/en.json';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider i18n={enTranslations}>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
); 