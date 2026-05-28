import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardPageClient from './DashboardPageClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const isClient = profile.role === 'client' || profile.role === 'both'
  let jobs = []

  if (isClient) {
    const { data: jobsData } = await supabase
      .from('jobs')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    jobs = jobsData || []
  } else {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('*, jobs(id, title, category, budget_max, status)')
      .eq('freelancer_id', user.id)
      .order('created_at', { ascending: false })
    
    jobs = (proposals || []).map(p => {
      const job = Array.isArray(p.jobs) ? p.jobs[0] : p.jobs
      return {
        id: job?.id || p.job_id,
        title: job?.title || 'Deleted Project',
        category: job?.category || 'Uncategorized',
        budget_max: job?.budget_max || 0,
        status: p.status, // Show proposal status
        proposals_count: 0,
        created_at: p.created_at
      }
    })
  }

  const { count: activeContracts } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)

  return (
    <DashboardPageClient 
      profile={profile} 
      jobs={jobs as any} 
      activeContracts={activeContracts || 0} 
    />
  )
}
