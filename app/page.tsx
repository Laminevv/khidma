import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import HomeContent from './HomeContent'

export const metadata: Metadata = {
  title: 'خدمة.dz | أكبر منصة للعمل الحر في الجزائر',
  description: 'وظّف أفضل المستقلين الجزائريين أو ابدأ عملك الحر. منصة خدمة.dz توفر نظام ضمان مالي متكامل لحماية حقوق الطرفين بأسعار تنافسية وطرق دفع محلية.',
  keywords: 'عمل حر، مستقلين، الجزائر، برمجة، تصميم، كتابة، تسويق، منصة عمل حر جزائرية، بريدي موب، خدمة.dz',
}

// Category definitions — name is the DB value, key maps to translation & icon
const categoryTemplates = [
  { name: 'برمجة وتطوير', key: 'development' },
  { name: 'تصميم جرافيك', key: 'design' },
  { name: 'ترجمة وكتابة', key: 'writing' },
  { name: 'مونتاج وفيديو', key: 'video' },
  { name: 'تسويق رقمي', key: 'marketing' },
  { name: 'استشارات', key: 'consulting' },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch latest open jobs
  const { data: latestJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      category,
      budget_min,
      budget_max,
      created_at,
      profiles:client_id(full_name, username)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch accurate category counts
  const categoryPromises = categoryTemplates.map(async (cat) => {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.name)
      .eq('status', 'open')
    return { ...cat, count: count || 0 }
  })

  const categories = await Promise.all(categoryPromises)

  return (
    <HomeContent
      user={user ? { id: user.id } : null}
      latestJobs={latestJobs}
      categories={categories}
    />
  )
}
