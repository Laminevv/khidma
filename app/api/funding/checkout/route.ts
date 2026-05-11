import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Chargily Pay V2 API Call
    const CHARGILY_URL = 'https://pay.chargily.net/test/api/v2/checkouts'
    const CHARGILY_SECRET_KEY = process.env.CHARGILY_SECRET_KEY

    if (!CHARGILY_SECRET_KEY) {
      console.error('Missing CHARGILY_SECRET_KEY')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const payload = {
      amount: amount,
      currency: 'dzd',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?funding=success`,
      failure_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?funding=failure`,
      webhook_endpoint: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/webhooks/chargily`,
      metadata: [
        {
          user_id: user.id
        }
      ]
    }

    const response = await fetch(CHARGILY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHARGILY_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chargily Checkout Error:', errorText)
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json({ checkout_url: data.checkout_url })

  } catch (error: any) {
    console.error('Funding Checkout Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
