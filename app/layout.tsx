import type { Metadata } from "next";
import { MarketingSignalProvider } from "../components/marketing/MarketingSignalProvider";
import "../styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://loom-signal-deck.vercel.app"),
  title: "Loom Signal Deck",
  description: "Loom member, track, CF, Harne, fan, campaign, and business signal deck.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MarketingSignalProvider analyticsProviderEnabled={process.env.VERCEL === "1"}>
          {children}
        </MarketingSignalProvider>
      </body>
    </html>
  );
}
