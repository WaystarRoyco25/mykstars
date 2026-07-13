import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mykstars.com"),
  title: {
    default: "MyKStars: K-stars, in focus",
    template: "%s · MyKStars",
  },
  description:
    "MyKStars covers Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion: credited coverage of the stars that matter, from official video and schedules to fan forecasts and credible analysis.",
  applicationName: "MyKStars",
  openGraph: {
    siteName: "MyKStars",
    type: "website",
    title: "MyKStars: K-stars, in focus",
    description:
      "Credited Korean celebrity coverage: official video, schedules, fan forecasts and credible analysis.",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-full flex flex-col bg-ink text-bone">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 scroll-mt-20">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
