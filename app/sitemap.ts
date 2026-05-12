import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://khidma.dz'

  // Initialize Supabase admin/anon client directly since this runs at build/server time
  // Using public anon key is fine for fetching public data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  try {
    // 2. Dynamic Job Routes
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, updated_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(100)

    const jobRoutes: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
      url: `${baseUrl}/jobs/${job.id}`,
      lastModified: new Date(job.updated_at || new Date()),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    // 3. Dynamic Profile Routes
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username, created_at')
      .neq('role', 'client') // Only freelancers and 'both'
      .limit(100)

    const profileRoutes: MetadataRoute.Sitemap = (profiles || []).map((profile) => ({
      url: `${baseUrl}/profile/${profile.username}`,
      lastModified: new Date(profile.created_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...jobRoutes, ...profileRoutes]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}
