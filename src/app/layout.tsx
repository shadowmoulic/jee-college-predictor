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
    default: "JEE College Predictor 2026 — IITs, NITs, IIITs | Nexus Predictor",
    template: "%s | Nexus Predictor",
  },
  description:
    "Free AI-powered JEE College Predictor 2026. Enter your JEE Advanced or JEE Main rank and instantly see your admission chances at IITs, NITs, IIITs, and GFTIs — powered by official JoSAA 2025 cutoff data.",
  keywords: [
    "JEE college predictor 2026",
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
  authors: [{ name: "Nexus Predictor" }],
  creator: "Nexus Predictor",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://jee-college-predicter.vercel.app")
  ),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Nexus Predictor",
    title: "JEE College Predictor 2026 — IITs, NITs, IIITs | Nexus Predictor",
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
      <body className={plusJakarta.className}>
        <Navbar />
        {children}
        <Footer />
        <WhatsAppPod />
      </body>
    </html>
  );
}
