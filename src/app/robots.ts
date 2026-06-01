import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jee-college-predicter.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
