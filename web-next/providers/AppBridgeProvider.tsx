"use client";
import React, { useMemo, createContext, useContext } from "react";
import createApp from "@shopify/app-bridge";

const AppBridgeReactContext = createContext<any>(null);

export function AppBridgeProvider({ children }: { children: React.ReactNode }) {
  let host: string | undefined;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    host = params.get("host") || (process.env.NODE_ENV === "development" ? "testhost" : undefined);
  }

  if (!host) {
    return (
      <div style={{ color: 'red', padding: 24, fontSize: 18 }}>
        <b>Missing <code>host</code> parameter in URL.</b><br/>
        Please access the app from Shopify admin, or add <code>?host=YOUR_HOST_STRING</code> to the URL.<br/>
        Example: <code>http://localhost:3000/?host=testhost</code>
      </div>
    );
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