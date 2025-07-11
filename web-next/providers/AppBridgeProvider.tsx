"use client";
import React, { useMemo, createContext, useContext } from "react";
import createApp from "@shopify/app-bridge";

const AppBridgeReactContext = createContext<any>(null);

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  let host: string | undefined;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    host = params.get("host") || undefined;
  }

  const appBridgeConfig = useMemo(
    () => ({
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
      host: host || "",
      forceRedirect: true,
    }),
    [host]
  );

  const appBridge = useMemo(() => createApp(appBridgeConfig), [appBridgeConfig]);

  return (
    <AppBridgeReactContext.Provider value={appBridge}>
      {children}
    </AppBridgeReactContext.Provider>
  );
}

export function useAppBridge() {
  return useContext(AppBridgeReactContext);
} 