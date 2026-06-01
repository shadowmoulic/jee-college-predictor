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
  title: "JEE Advanced College Predictor 2026 (JoSAA) | Nexus Predictor",
  description:
    "Advanced AI-powered College Admission Predictor for JEE, NITs, and IIITs based on your JEE Advanced 2026 rank. Completely free, fast, and accurate — powered by official JoSAA data.",
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
