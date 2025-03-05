"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from "next-auth/react"
import { SWRConfig } from 'swr'

import "@/utils/i18n";

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
                    fetcher: (resource, init) => fetch(resource, init).then(res => res.json()).then(data => data.data)
                }}
            >
                <ThemeProvider attribute="data-joy-color-scheme">
                    <SessionProvider>
                        {children}
                    </SessionProvider>
                </ThemeProvider>
            </SWRConfig>
        ) : <div>isMounting</div>
    );
};

export default ClientContext;
