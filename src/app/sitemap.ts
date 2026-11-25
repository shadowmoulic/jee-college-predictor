import { getCutoffGuides } from "@/lib/cutoff-guides";
import { siteUrl } from "@/lib/site";
import { MetadataRoute } from 'next';
import { getJosaaData, getPopularCompareSlugs } from '@/lib/josaa-data';
import { getInstituteId } from '@/app/data';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allRecords = getJosaaData();
  const institutes = new Set(allRecords.map(record => record.institute));
  const instituteIds = new Set([...institutes].map(getInstituteId).filter(Boolean));

  // 1. Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl("/") },
    { url: siteUrl("/colleges") },
    { url: siteUrl("/cutoffs") },
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

  const cutoffRoutes = [...getCutoffGuides().keys()].map(path => ({ url: siteUrl(path) }));
  return [...staticRoutes, ...collegeRoutes, ...compareRoutes, ...cutoffRoutes];
}

