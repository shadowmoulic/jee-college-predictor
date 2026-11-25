import type { Metadata } from "next";
import PredictorPage from "@/components/predictor/PredictorPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, siteUrl } from "@/lib/site";

const title = "JEE College Predictor 2026 for Main & Advanced";
const description = "Estimate IIT, NIT, IIIT and GFTI options from your JEE rank. This free tool uses historical JoSAA cutoffs and accounts for category, seat pool and state.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/" },
};

export default function Home() {
  return (
    <>
      <JsonLd data={{
        "@type": "WebApplication",
        "@id": siteUrl() + "#predictor",
        name: SITE_NAME,
        url: siteUrl(),
        description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "INR" },
      }} />
      <PredictorPage />
    </>
  );
}
