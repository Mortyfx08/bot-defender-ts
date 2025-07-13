import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { AppProvider } from '@shopify/polaris';

jest.mock('../StoreConfig', () => {
  const Mock = () => <div>StoreConfig</div>;
  Mock.displayName = 'MockStoreConfig';
  return Mock;
});
jest.mock('../ThreatFeedMetrics', () => {
  const Mock = () => <div>ThreatFeedMetrics</div>;
  Mock.displayName = 'MockThreatFeedMetrics';
  return Mock;
});
jest.mock('../ActivityLog', () => {
  const Mock = () => <div>ActivityLog</div>;
  Mock.displayName = 'MockActivityLog';
  return Mock;
});
jest.mock('../LiveBotActivity', () => {
  const Mock = () => <div>LiveBotActivity</div>;
  Mock.displayName = 'MockLiveBotActivity';
  return Mock;
});

const i18n = { en: {}};

const renderWithProvider = (ui: React.ReactElement) =>
  render(
    <AppProvider i18n={i18n}>
      {ui}
    </AppProvider>
  );

describe('Dashboard', () => {
  it('renders loading state', () => {
    // Set search param using pushState
    window.history.pushState({}, '', '/?shop=test-shop.myshopify.com');
    // Mock localStorage
    const localStorageMock = (function() {
      let store: Record<string, string> = {};
      return {
        getItem(key: string) { return store[key] || null; },
        setItem(key: string, value: string) { store[key] = value; },
        removeItem(key: string) { delete store[key]; },
        clear() { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    if (!globalThis.fetch) globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as unknown as Response);
    jest.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {})); // never resolves
    renderWithProvider(<Dashboard />);
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    window.history.pushState({}, '', '/?shop=test-shop.myshopify.com');
    const localStorageMock = (function() {
      let store: Record<string, string> = {};
      return {
        getItem(key: string) { return store[key] || null; },
        setItem(key: string, value: string) { store[key] = value; },
        removeItem(key: string) { delete store[key]; },
        clear() { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    if (!globalThis.fetch) globalThis.fetch = () => Promise.reject(new Error('fail'));
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch dashboard data'));
    renderWithProvider(<Dashboard />);
    // Wait for error banner to appear
    const errorBanner = await screen.findByText(/Error/i);
    expect(errorBanner).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch dashboard data/)).toBeInTheDocument();
  });

  it('renders success state', async () => {
    window.history.pushState({}, '', '/?shop=test-shop.myshopify.com');
    const localStorageMock = (function() {
      let store: Record<string, string> = {};
      return {
        getItem(key: string) { return store[key] || null; },
        setItem(key: string, value: string) { store[key] = value; },
        removeItem(key: string) { delete store[key]; },
        clear() { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    const dashboardData = {
      shop: { domain: 'test-shop.myshopify.com', name: 'Test Shop' },
      metrics: {
        totalAlerts: 5,
        totalBlockedIPs: 2,
        recentBotActivities: 1,
        threatFeedMetrics: { lastUpdate: new Date().toISOString() },
      },
    };
    const configData = {
      data: {
        theme: 'system', notifications: true, autoBlock: true, blockThreshold: 5, dashboardLayout: 'detailed', primaryColor: '#008060', refreshInterval: 30, showMetrics: { totalAlerts: true, blockedIPs: true, botActivities: true, threatFeed: true }, timezone: 'UTC', dateFormat: 'MM/DD/YYYY',
      },
    };
    if (!globalThis.fetch) globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as unknown as Response);
    jest.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: dashboardData }) } as unknown as Response) // dashboard
      .mockResolvedValueOnce({ ok: true, json: async () => configData } as unknown as Response); // config
    renderWithProvider(<Dashboard />);
    // Wait for dashboard content
    expect(await screen.findByText(/Store Information/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Test Shop/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Total Alerts/i)).toBeInTheDocument();
  });
}); 