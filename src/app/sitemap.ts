import { MetadataRoute } from 'next';
import { getJosaaData, getPopularCompareSlugs } from '@/lib/josaa-data';
import { getInstituteId } from '@/app/data';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jee-college-predicter.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allRecords = getJosaaData();
  const institutes = Array.from(new Set(allRecords.map(r => r.institute)));
  const instituteIds = institutes.map(getInstituteId);

  // 1. Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/colleges`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/compare`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/ai`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // 2. Dynamic College routes
  const collegeRoutes: MetadataRoute.Sitemap = instituteIds.map(id => ({
    url: `${BASE_URL}/college/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Top Compare routes (Programmatic SEO)
  const compareSlugs = getPopularCompareSlugs();
  const compareRoutes: MetadataRoute.Sitemap = compareSlugs.map(slug => ({
    url: `${BASE_URL}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...collegeRoutes, ...compareRoutes];
}

