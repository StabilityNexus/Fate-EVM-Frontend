import { MetadataRoute } from 'next'

// Required for static export
export const dynamic = 'force-static'
export const revalidate = false

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://evm.fate.stability.nexus'
  const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  return [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/explorePools`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/createPool`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/portfolio`,
      lastModified: currentDate,
    },
  ]
}
