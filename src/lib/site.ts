export const SITE_NAME = "JEE College Predictor";

const origin = new URL(
  process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://jee-college-predicter.vercel.app")
).origin;

export function siteUrl(path = "/") {
  return new URL(path, origin).href;
}

export function collegeEntity(id: string, name: string, shortName?: string, state?: string) {
  const url = siteUrl(`/college/${id}`);
  return {
    "@type": "CollegeOrUniversity",
    "@id": url + "#college",
    url,
    name,
    alternateName: shortName || undefined,
    address: state ? { "@type": "PostalAddress", addressRegion: state, addressCountry: "IN" } : undefined,
  };
}
