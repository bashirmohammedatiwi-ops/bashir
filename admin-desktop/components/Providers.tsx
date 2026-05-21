"use client";

import React, { useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App, ConfigProvider, theme } from "antd";

import { AuthBootstrap } from "@/components/AuthBootstrap";



export function Providers({ children }: { children: React.ReactNode }) {

  const [client] = useState(

    () =>

      new QueryClient({

        defaultOptions: {

          queries: {

            refetchOnWindowFocus: false,

            refetchOnReconnect: false,

            staleTime: 5 * 60_000,

            gcTime: 30 * 60_000,

            retry: 1,

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

          },

        }}

      >

        <App>

          <AuthBootstrap />

          {children}

        </App>

      </ConfigProvider>

    </QueryClientProvider>

  );

}

