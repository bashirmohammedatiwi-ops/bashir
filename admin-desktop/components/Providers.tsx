"use client";

import React, { useState } from "react";
import { keepPreviousData, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider, theme } from "antd";
import { apiErrorMessage } from "@/lib/apiError";

function QueryLayer({ children }: { children: React.ReactNode }) {
  const { message } = App.useApp();
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
          mutations: {
            onError: (error) => {
              message.error(apiErrorMessage(error));
            },
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      direction="rtl"
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#4a2466",
          colorBgContainer: "#ffffff",
          colorBgLayout: "#f0eef3",
          borderRadius: 10,
          borderRadiusLG: 14,
          fontFamily: 'var(--font-cairo), "Segoe UI", Tahoma, "Arabic Typesetting", sans-serif',
          controlHeight: 38,
          colorLink: "#4a2466",
          colorLinkHover: "#6b3d8f",
        },
        components: {
          Table: {
            cellPaddingBlock: 12,
            cellPaddingInline: 14,
            headerBg: "#faf8fc",
            headerColor: "#4a2466",
            rowHoverBg: "#faf8fc",
          },
          Card: { paddingLG: 18 },
          Drawer: { paddingLG: 20 },
          Button: { primaryShadow: "0 2px 8px rgba(74, 36, 102, 0.18)" },
          Input: { activeBorderColor: "#4a2466", hoverBorderColor: "#8b6fa8" },
          Select: { optionSelectedBg: "#f3eef8" },
        },
      }}
    >
      <App>
        <QueryLayer>{children}</QueryLayer>
      </App>
    </ConfigProvider>
  );
}
