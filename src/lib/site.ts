export const SITE_NAME = "JEE College Predictor 2027";

export const SITE_CREATOR = {
  name: "Sayak Moulic",
  profile: "https://youtube.com/@sayakmoulic",
};

const productionOrigin = "https://jee-college-predictor-2027.vercel.app";
// This similarly named host belongs to a different site.
const unrelatedHostname = "jee-college-predictor.vercel.app";
const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
const configuredOrigin = configuredUrl ? new URL(configuredUrl) : null;
const isLocalOrigin = configuredOrigin &&
  ["localhost", "127.0.0.1", "[::1]"].includes(configuredOrigin.hostname);

const origin = configuredOrigin && configuredOrigin.hostname !== unrelatedHostname &&
  (!isLocalOrigin || process.env.NODE_ENV === "development")
  ? configuredOrigin.origin
  : productionOrigin;

export function siteCreatorId() {
  return siteUrl() + "#sayak-moulic";
}

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
