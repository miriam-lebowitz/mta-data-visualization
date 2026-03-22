import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Share_Tech_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "NYC Transit — System Status",
    template: "%s | NYC Transit",
  },
  description:
    "Real-time NYC subway system status, live train map, service alerts, and line performance rankings.",
  keywords: [
    "NYC subway",
    "MTA",
    "MTA live map",
    "subway tracker",
    "real-time subway",
    "NYC transit status",
    "subway delays",
    "MTA status",
    "New York City subway",
    "train tracker",
    "subway alerts",
    "MTA subway map",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "NYC Transit",
    title: "NYC Transit — System Status",
    description:
      "Real-time NYC subway system status, live train map, service alerts, and line performance rankings.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "NYC Transit — System Status",
    description:
      "Real-time NYC subway system status, live train map, service alerts, and line performance rankings.",
  },
  category: "transportation",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5f0e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${shareTechMono.variable} h-full`}
    >
      <body className="flex h-full flex-col overflow-hidden bg-background text-foreground pb-[env(safe-area-inset-bottom,0px)]">
        <Nav />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
