"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "next-auth/react"
import { SWRConfig } from 'swr'

import "@/utils/i18n";
import { Toaster } from "./ui/toaster";

const ClientContext = ({ children }: { children: React.ReactNode }) => {

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true); // 页面挂载完成
        return () => {
            setIsMounted(false); // 页面卸载
        };
    }, []);

    if (!isMounted) {
        return false;
    }

    return (
        isMounted ? (
            <SWRConfig
                value={{
                    // refreshInterval: 10000,
                    fetcher: (resource, init) => {
                        // useChat breaks custom SWR fetcher implementation #3214
                        // https://github.com/vercel/ai/issues/3214
                        if (resource?.[0].startsWith("/api/chat")) {
                            return undefined;
                        }
                        return fetch(resource, init).then(res => res.json()).then(data => data.data)
                    }
                }}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <SessionProvider>
                        {children}
                        <Toaster />
                    </SessionProvider>
                </ThemeProvider>
            </SWRConfig>
        ) : <div>isMounting</div>
    );
};

export default ClientContext;
