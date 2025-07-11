import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';
import ActivityLog from '../ActivityLog';

const i18n = { en: {} };
const renderWithProvider = (ui: React.ReactElement) =>
  render(<AppProvider i18n={i18n}>{ui}</AppProvider>);

describe('ActivityLog', () => {
  it('renders loading state', () => {
    if (!globalThis.fetch) globalThis.fetch = () => new Promise(() => {});
    jest.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    renderWithProvider(<ActivityLog shop="test-shop.myshopify.com" />);
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    if (!globalThis.fetch) globalThis.fetch = () => Promise.reject(new Error('Failed to fetch activity log'));
    jest.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Failed to fetch activity log'));
    renderWithProvider(<ActivityLog shop="test-shop.myshopify.com" />);
    expect(await screen.findByText(/No activity yet/i)).toBeInTheDocument();
  });

  it('renders success state', async () => {
    if (!globalThis.fetch) globalThis.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as unknown as Response);
    const activities = [{ type: '', severity: 'high', time: '10/07/2025 21:07:27', details: '', id: 1, shop: 'test-shop.myshopify.com' }];
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => activities } as unknown as Response);
    renderWithProvider(<ActivityLog shop="test-shop.myshopify.com" />);
    expect(await screen.findByText('Type')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });
}); 