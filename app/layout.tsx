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
  title: "NYC Transit — System Status",
  description: "Real-time NYC subway system status and line performance rankings.",
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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Nav />
        <main className="flex flex-col flex-1">{children}</main>
      </body>
    </html>
  );
}
