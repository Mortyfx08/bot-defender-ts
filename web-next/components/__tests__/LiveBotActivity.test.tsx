import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveBotActivity from '../LiveBotActivity';
import { AppProvider } from '@shopify/polaris';

const i18n = { locale: 'en', translations: {} };

describe('LiveBotActivity', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    if (!global.fetch) {
      global.fetch = jest.fn();
    }
  });

  function setupFetch(data: unknown, delay = 0) {
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => data,
            } as Response),
          delay
        )
      )
    );
  }

  it('renders loading state', async () => {
    setupFetch([], 100); // delay to keep loading
    render(
      <AppProvider i18n={i18n}>
        <LiveBotActivity shop="test-shop" />
      </AppProvider>
    );
    expect(screen.getByText('Live Bot Activity')).toBeInTheDocument();
    expect(screen.getAllByText((content, element) => element?.className?.includes('Polaris-SkeletonBodyText') ?? false).length).toBeGreaterThan(0);
  });

  it('renders empty state', async () => {
    setupFetch([]);
    render(
      <AppProvider i18n={i18n}>
        <LiveBotActivity shop="test-shop" />
      </AppProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('No live bot activity yet')).toBeInTheDocument();
      expect(screen.getByText('Once your store receives traffic, live bot activity will appear here.')).toBeInTheDocument();
    });
  });

  it('renders table with activities', async () => {
    const activities = [
      {
        id: '1',
        ip: '1.2.3.4',
        userAgent: 'bot',
        path: '/test',
        severity: 'high',
        timestamp: new Date().toISOString(),
        reason: 'Test',
      },
    ];
    setupFetch(activities);
    render(
      <AppProvider i18n={i18n}>
        <LiveBotActivity shop="test-shop" />
      </AppProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('Live Bot Activity')).toBeInTheDocument();
      expect(screen.getByText('1.2.3.4')).toBeInTheDocument();
      expect(screen.getByText('bot')).toBeInTheDocument();
      expect(screen.getByText('/test')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });
}); 