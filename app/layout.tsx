import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "Loom Signal Deck",
  description: "Loom member signal deck prototype.",
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
      <body>{children}</body>
    </html>
  );
}
