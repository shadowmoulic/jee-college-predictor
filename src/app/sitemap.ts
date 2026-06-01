import { MetadataRoute } from 'next';
import { getJosaaData } from '@/lib/josaa-data';
import { getInstituteId, TOP_5_IITS, TOP_10_IITS } from '@/app/data';

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
  const compareRoutes: MetadataRoute.Sitemap = [];
  const topIitIds = Array.from(TOP_10_IITS).map(getInstituteId);
  
  // Generate combinations of Top 10 IITs against each other
  for (let i = 0; i < topIitIds.length; i++) {
    for (let j = i + 1; j < topIitIds.length; j++) {
      compareRoutes.push({
        url: `${BASE_URL}/compare/${topIitIds[i]}-vs-${topIitIds[j]}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // Generate some top NIT combinations (hardcoded top 5 for sitemap size)
  const topNits = [
    'National Institute of Technology Tiruchirappalli',
    'National Institute of Technology Karnataka Surathkal',
    'National Institute of Technology Rourkela',
    'National Institute of Technology Warangal',
    'Motilal Nehru National Institute of Technology Allahabad'
  ];
  const topNitIds = topNits.map(getInstituteId);
  for (let i = 0; i < topNitIds.length; i++) {
    for (let j = i + 1; j < topNitIds.length; j++) {
      compareRoutes.push({
        url: `${BASE_URL}/compare/${topNitIds[i]}-vs-${topNitIds[j]}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return [...staticRoutes, ...collegeRoutes, ...compareRoutes];
}
