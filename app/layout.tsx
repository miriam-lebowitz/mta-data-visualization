import type { Metadata } from "next";
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
      <body className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        <Nav />
        <main className="flex flex-col flex-1 min-h-0">{children}</main>
      </body>
    </html>
  );
}
