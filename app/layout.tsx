import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/utils";
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
        <title>BookCraft</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta
          name="description"
          content="Create your next masterpiece with the help of BookCraft"
        />
        <meta property="og:title" content="BookCraft" />
        <meta
          property="og:description"
          content="Create your next masterpiece with the help of BookCraft"
        />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BookCraft" />
        <meta
          name="twitter:description"
          content="Create your next masterpiece with the help of BookCraft"
        />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={cn(publicSans.className, "h-screen")}>
        <ClientContext>
          {children}
        </ClientContext>
        <Toaster />
      </body>
    </html>
  );
}
