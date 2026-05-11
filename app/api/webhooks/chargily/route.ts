import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const CHARGILY_WEBHOOK_SECRET = process.env.CHARGILY_WEBHOOK_SECRET

    if (!CHARGILY_WEBHOOK_SECRET) {
      console.error('Missing CHARGILY_WEBHOOK_SECRET')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify Signature
    const computedSignature = crypto
      .createHmac('sha256', CHARGILY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    if (signature !== computedSignature) {
      console.error('Invalid signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const event = JSON.parse(rawBody)

    // We only care about checkout.paid events
    if (event.type === 'checkout.paid') {
      const checkout = event.data
      const amount = checkout.amount
      // Chargily metadata might be an array of objects or an object depending on version. 
      // Handling based on array structure defined in checkout route.
      const metadataStr = checkout.metadata
      let userId: string | null = null
      
      if (Array.isArray(metadataStr)) {
        const userMeta = metadataStr.find((m: any) => m.user_id)
        if (userMeta) userId = userMeta.user_id
      } else if (typeof metadataStr === 'object' && metadataStr.user_id) {
        userId = metadataStr.user_id
      }

      if (!userId) {
        console.error('No user_id found in metadata')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      // Initialize Supabase Admin client to bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Call the secure RPC to process the deposit
      const { error: rpcError } = await supabaseAdmin.rpc('process_deposit', {
        p_user_id: userId,
        p_amount: amount,
        p_reference: checkout.id
      })

      if (rpcError) {
        console.error('Deposit RPC Error:', rpcError)
        // If it's a unique constraint violation (webhook retried), we can return 200
        if (rpcError.code === '23505') { // Postgres unique violation
          return NextResponse.json({ success: true, message: 'Already processed' })
        }
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
