import { createClient } from '@/lib/supabase/server'
import ClientJobPage from './ClientJobPage'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('title, category, budget_min, budget_max, description')
    .eq('id', id)
    .single()

  if (!job) {
    return {
      title: 'مشروع غير موجود | خدمة.dz',
    }
  }

  const title = `${job.title} — ${job.budget_min} إلى ${job.budget_max} دج | خدمة.dz`
  const description = job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://khidma.dz/jobs/${id}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default function JobPage() {
  return <ClientJobPage />
}
