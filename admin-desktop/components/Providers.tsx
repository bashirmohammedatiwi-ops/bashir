"use client";

import React, { useState } from "react";
import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider, theme } from "antd";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            staleTime: 2 * 60_000,
            gcTime: 15 * 60_000,
            retry: 1,
            placeholderData: keepPreviousData,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <ConfigProvider
        direction="rtl"
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#4a2466",
            borderRadius: 10,
            fontFamily: 'Cairo, "Segoe UI", sans-serif',
            controlHeight: 36,
          },
          components: {
            Table: { cellPaddingBlock: 10, cellPaddingInline: 12 },
            Card: { paddingLG: 16 },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
