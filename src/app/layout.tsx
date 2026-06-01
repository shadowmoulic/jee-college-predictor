import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import WhatsAppPod from "@/components/layout/WhatsAppPod";
import Footer from "@/components/layout/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: {
    default: "JEE College Predicter 2026: 100% Accurate JoSAA Cutoffs",
    template: "%s | JEE College Predicter",
  },
  description:
    "Don't guess your college! Use the most accurate JoSAA 2026 College Predictor. Enter your JEE Advanced or Main rank and instantly find out your exact admission chances at IITs, NITs, and IIITs.",
  keywords: [
    "JEE college predicter",
    "JEE college predictor",
    "JEE college predictor 2026",
    "JoSAA college predicter",
    "JoSAA college predictor",
    "JEE Advanced rank predictor",
    "JEE Main college predictor",
    "IIT admission predictor",
    "NIT predictor",
    "JoSAA cutoff 2025",
    "JoSAA 2026",
    "college predictor JEE",
    "Nexus Predictor",
  ],
  authors: [{ name: "JEE College Predicter" }],
  creator: "JEE College Predicter",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://jee-college-predicter.vercel.app")
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "JEE College Predicter",
    title: "JEE College Predicter 2026 | IITs, NITs, IIITs",
    description:
      "Enter your JEE rank and instantly see your IIT, NIT, and IIIT admission chances. Free, accurate, and powered by official JoSAA cutoff data.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "JEE College Predictor 2026 — IITs, NITs, IIITs | Nexus Predictor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE College Predictor 2026 | Nexus Predictor",
    description:
      "Free JEE rank-based college predictor. Check your IIT, NIT & IIIT admission chances using JoSAA 2025 data.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
        <Navbar />
        {children}
        <Footer />
        <WhatsAppPod />
      </body>
    </html>
  );
}
