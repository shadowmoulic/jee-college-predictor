import { siteUrl } from "@/lib/site";
import { MetadataRoute } from 'next';
import { getJosaaData, getPopularCompareSlugs } from '@/lib/josaa-data';
import { getInstituteId } from '@/app/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allRecords = getJosaaData();
  const institutes = Array.from(new Set(allRecords.map(r => r.institute)));
  const instituteIds = institutes.map(getInstituteId);

  // 1. Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/") },
    { url: siteUrl("/colleges") },
    { url: siteUrl("/compare") },
    { url: siteUrl("/terms") },
  ];

  // 2. Dynamic College routes
  const collegeRoutes: MetadataRoute.Sitemap = instituteIds.map(id => ({
    url: siteUrl(`/college/${id}`),
  }));

  // 3. Top Compare routes (Programmatic SEO)
  const compareSlugs = getPopularCompareSlugs();
  const compareRoutes: MetadataRoute.Sitemap = compareSlugs.map(slug => ({
    url: siteUrl(`/compare/${slug}`),
  }));

  return [...staticRoutes, ...collegeRoutes, ...compareRoutes];
}

