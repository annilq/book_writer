import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ClientContext from "@/components/ClientContext";

const publicSans = Public_Sans({ subsets: ["latin"] });


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Book Writer</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Starter template showing how to use LangChain in Next.js projects. See source code and deploy your own at https://github.com/langchain-ai/langchain-nextjs-template!"
        />
        <meta property="og:title" content="LangChain + Next.js Template" />
        <meta
          property="og:description"
          content="Starter template showing how to use LangChain in Next.js projects. See source code and deploy your own at https://github.com/langchain-ai/langchain-nextjs-template!"
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LangChain + Next.js Template" />
        <meta
          name="twitter:description"
          content="Starter template showing how to use LangChain in Next.js projects. See source code and deploy your own at https://github.com/langchain-ai/langchain-nextjs-template!"
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={cn(publicSans.className, "flex flex-col bg-gradient-to-r from-purple-500 to-indigo-600 text-white min-h-screen overflow-y-scroll hide-scrollbar")}>
        <ClientContext>
          <div className="h-screen flex flex-col">
            <Header />
            <div className="flex-1 relative items-center">
              {children}
            </div>
          </div>
        </ClientContext>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
