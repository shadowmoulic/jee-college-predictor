import type { Metadata } from "next";
import { SITE_CREATOR, SITE_NAME, siteCreatorId, siteUrl } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ChapterwiseBanner from "@/components/layout/ChapterwiseBanner";
import Navbar from "@/components/layout/Navbar";
import BookCallButton from "@/components/layout/BookCallButton";
import Footer from "@/components/layout/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: "Estimate JEE Main and Advanced college options using historical JoSAA opening and closing ranks.",
  authors: [{ name: SITE_CREATOR.name, url: SITE_CREATOR.profile }],
  creator: SITE_CREATOR.name,
  publisher: SITE_CREATOR.name,
  metadataBase: new URL(siteUrl()),
  openGraph: { type: "website", locale: "en_IN", siteName: SITE_NAME },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  verification: {
    google: "sR7IQBlhR4qcwJpub9cbUsb1N9ZN7PC9OlbRFwpW4FM",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={plusJakarta.className} suppressHydrationWarning>
        <JsonLd data={{
          "@type": "WebSite",
          "@id": siteUrl() + "#website",
          url: siteUrl(),
          name: SITE_NAME,
          alternateName: "JEE College Predictor",
          inLanguage: "en-IN",
          creator: { "@id": siteCreatorId() },
          publisher: {
            "@type": "Person",
            "@id": siteCreatorId(),
            name: SITE_CREATOR.name,
            sameAs: [SITE_CREATOR.profile],
          },
        }} />
        <Navbar />
        <ChapterwiseBanner />
        {children}
        <Footer />
        <BookCallButton />
      </body>
    </html>
  );
}
