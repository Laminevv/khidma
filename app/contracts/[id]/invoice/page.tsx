import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InvoiceClient from './InvoiceClient'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch contract data with client, freelancer, and jobs fields
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      *,
      client:profiles!client_id(id, username, full_name),
      freelancer:profiles!freelancer_id(id, username, full_name),
      jobs(id, title)
    `)
    .eq('id', id)
    .single()

  if (error || !contract) {
    return <InvoiceClient contract={null} />
  }

  // Security Check: Only the client or the freelancer involved in the contract can view the invoice
  if (contract.client_id !== user.id && contract.freelancer_id !== user.id) {
    redirect('/contracts')
  }

  // Financial calculations
  const totalAmount = contract.total_amount || 0
  const platformFee = Math.round(totalAmount * 0.10)
  const netPayout = Math.round(totalAmount * 0.90)

  // Formatting dates
  const invoiceDate = contract.created_at
    ? new Date(contract.created_at).toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('ar-DZ')

  // Generate unique codes based on DB ID
  const invoiceNumber = `KD-INV-${contract.id.substring(0, 8).toUpperCase()}`
  const paymentReference = `BM-REF-${contract.id.substring(24, 36).toUpperCase()}`

  return (
    <InvoiceClient 
      contract={contract} 
      invoiceNumber={invoiceNumber} 
      paymentReference={paymentReference} 
      invoiceDate={invoiceDate} 
      platformFee={platformFee} 
      netPayout={netPayout} 
      totalAmount={totalAmount} 
    />
  )
}
