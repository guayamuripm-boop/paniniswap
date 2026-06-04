import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authHeader) return Response.json({ error: 'No auth' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader)
    if (!user) return Response.json({ error: 'No user' }, { status: 401 })

    const { subscription } = await req.json()
    if (!subscription) return Response.json({ error: 'No subscription' }, { status: 400 })

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!authHeader) return Response.json({ error: 'No auth' }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
    )

    const { data: { user } } = await supabase.auth.getUser(authHeader)
    if (!user) return Response.json({ error: 'No user' }, { status: 401 })

    await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
