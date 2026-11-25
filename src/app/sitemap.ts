import { getCutoffGuides } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import { MetadataRoute } from 'next';
import { getPopularCompareSlugs } from '@/lib/josaa-data';
import { getJosaaColleges } from '@/lib/josaa-colleges';
import { getYearComparisons } from '@/lib/cutoff-year-comparisons';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const instituteIds = getJosaaColleges().keys();

  // 1. Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/") },
    { url: siteUrl("/colleges") },
    { url: siteUrl("/cutoffs") },
    { url: siteUrl("/cutoffs/2026") },
    { url: siteUrl("/cutoffs/2025-vs-2026") },
    { url: siteUrl("/predictor-comparisons") },
    { url: siteUrl("/predictor-comparisons/shiksha") },
    { url: siteUrl("/predictor-comparisons/careers360") },
    { url: siteUrl("/mentorship") },
    { url: siteUrl("/compare") },
    { url: siteUrl("/terms") },
  ];

  // 2. Dynamic College routes
  const collegeRoutes: MetadataRoute.Sitemap = [...instituteIds].map(id => ({
    url: siteUrl(`/college/${id}`),
  }));

  // 3. Top Compare routes (Programmatic SEO)
  const compareSlugs = new Set(getPopularCompareSlugs());
  const compareRoutes: MetadataRoute.Sitemap = [...compareSlugs].map(slug => ({
    url: siteUrl(`/compare/${slug}`),
  }));

  const cutoffRoutes = [...getCutoffGuides().keys(), ...getYearComparisons().keys()].map(path => ({ url: siteUrl(path) }));
  return [...staticRoutes, ...collegeRoutes, ...compareRoutes, ...cutoffRoutes];
}

