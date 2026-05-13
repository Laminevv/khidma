import { NextResponse } from 'next/server'
import * as crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────
// Chargily Pay V2 Webhook Handler
//
// Per the Chargily V2 docs, the `signature` header is an
// HMAC-SHA256 of the raw request body signed with the same
// CHARGILY_SECRET_KEY used for API calls — there is NO
// separate webhook secret.
// ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // ── 1. Extract raw body & signature header ──────────────
    const rawBody = await request.text()
    const signature = request.headers.get('signature')

    if (!signature) {
      console.error('[Chargily Webhook] Missing signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // ── 2. Verify HMAC-SHA256 with CHARGILY_SECRET_KEY ──────
    const CHARGILY_SECRET_KEY = process.env.CHARGILY_SECRET_KEY

    if (!CHARGILY_SECRET_KEY) {
      console.error('[Chargily Webhook] Missing CHARGILY_SECRET_KEY env var')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const computedSignature = crypto
      .createHmac('sha256', CHARGILY_SECRET_KEY)
      .update(rawBody)
      .digest('hex')

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, 'hex')
    const compBuffer = Buffer.from(computedSignature, 'hex')

    if (
      sigBuffer.length !== compBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, compBuffer)
    ) {
      console.error('[Chargily Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      )
    }

    // ── 3. Parse the JSON payload ───────────────────────────
    const event = JSON.parse(rawBody)

    console.log('[Chargily Webhook] Received event:', event.type)

    // ── 4. Handle checkout.paid ─────────────────────────────
    if (event.type === 'checkout.paid') {
      const checkout = event.data
      const amount = checkout.amount
      const checkoutId = checkout.id

      // Extract user_id from metadata.
      // Two checkout flows exist in the codebase:
      //   • Deposit flow  → metadata = { user_id, transaction_id }
      //   • Funding flow  → metadata = [{ user_id }]
      const metadata = checkout.metadata
      let userId: string | null = null
      let pendingTxnId: string | null = null

      if (Array.isArray(metadata)) {
        const entry = metadata.find((m: Record<string, string>) => m.user_id)
        if (entry) userId = entry.user_id
      } else if (typeof metadata === 'object' && metadata !== null) {
        userId = metadata.user_id ?? null
        pendingTxnId = metadata.transaction_id ?? null
      }

      if (!userId) {
        console.error('[Chargily Webhook] No user_id in metadata:', metadata)
        return NextResponse.json(
          { error: 'Missing user_id in metadata' },
          { status: 400 }
        )
      }

      // ── Supabase Admin client (service role — bypasses RLS) ─
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // ── Call the secure process_deposit RPC ────────────────
      // This atomically:
      //   1. Credits the user's wallet balance
      //   2. Inserts a completed deposit transaction
      // The `reference` column has a UNIQUE constraint, making
      // this naturally idempotent against webhook retries.
      const { error: rpcError } = await supabaseAdmin.rpc(
        'process_deposit',
        {
          p_user_id: userId,
          p_amount: amount,
          p_reference: checkoutId,
        }
      )

      if (rpcError) {
        // Unique constraint violation on `reference` → already processed
        if (rpcError.code === '23505') {
          console.log('[Chargily Webhook] Already processed (reference):', checkoutId)
          return NextResponse.json({ success: true, message: 'Already processed' })
        }
        console.error('[Chargily Webhook] process_deposit RPC error:', rpcError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // ── If the deposit flow created a pending transaction, ─
      // ── mark it as completed so the wallet UI stays clean. ─
      if (pendingTxnId) {
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({ status: 'completed' as const })
          .eq('id', pendingTxnId)
          .eq('status', 'pending')

        if (updateError) {
          // Non-critical — the deposit was already processed above.
          // Log but don't fail the webhook.
          console.warn(
            '[Chargily Webhook] Could not update pending txn:',
            pendingTxnId,
            updateError
          )
        }
      }

      console.log(
        '[Chargily Webhook] ✅ Deposit processed — user:', userId,
        '| amount:', amount, 'DZD',
        '| checkout:', checkoutId
      )
    }

    // ── 5. Return 200 OK ────────────────────────────────────
    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Chargily Webhook] Unhandled error:', message)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
