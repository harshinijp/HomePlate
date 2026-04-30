import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json()

  if (action === 'like') {
    await supabase.from('likes').insert({ user_id: user.id, post_id: params.id })
  } else if (action === 'unlike') {
    await supabase.from('likes').delete().match({ user_id: user.id, post_id: params.id })
  } else if (action === 'save') {
    await supabase.from('saved_posts').insert({ user_id: user.id, post_id: params.id })
  } else if (action === 'unsave') {
    await supabase.from('saved_posts').delete().match({ user_id: user.id, post_id: params.id })
  }

  return NextResponse.json({ success: true })
}