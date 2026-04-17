import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// PATCH /api/admin/tenants/[tenantId]/modules
// Body: { module_slug: string, is_active: boolean }
// Toggle individual de un módulo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params
  const supabase = await createClient()

  // Validar sesión
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Validar que sea SUPER_ADMIN
  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role')
    .eq('id', user.id)
    .single()

  if (profile?.app_role !== 'SUPER_ADMIN' && profile?.app_role !== 'superadmin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const { module_slug, is_active } = body

  if (!module_slug || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  console.log(`[API/Modules][PATCH] tenantId: ${resolvedParams.tenantId}, module: ${module_slug}, active: ${is_active}`)

  const { error } = await supabase
    .from('tenant_modules')
    .update({ is_active })
    .eq('tenant_id', resolvedParams.tenantId)
    .eq('module_slug', module_slug)

  if (error) {
    console.error('[API/Modules][PATCH] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[API/Modules][PATCH] ✅ Módulo actualizado`)
  return NextResponse.json({ success: true, module_slug, is_active })
}

// POST /api/admin/tenants/[tenantId]/modules
// Body: { plan_slug: 'free' | 'starter' | 'professional' | 'enterprise' }
// Sincroniza todos los módulos según el plan usando la función de Supabase
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role')
    .eq('id', user.id)
    .single()

  if (profile?.app_role !== 'SUPER_ADMIN' && profile?.app_role !== 'superadmin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await req.json()
  const { plan_slug } = body

  const validPlans = ['free', 'starter', 'professional', 'enterprise']
  if (!validPlans.includes(plan_slug)) {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  console.log(`[API/Modules][POST] tenantId: ${resolvedParams.tenantId}, plan: ${plan_slug}`)

  const { data, error } = await supabase.rpc('activate_modules_for_tenant', {
    p_tenant_id: resolvedParams.tenantId,
    p_plan_slug: plan_slug,
  })

  if (error) {
    console.error('[API/Modules][POST] Error RPC:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[API/Modules][POST] ✅ Plan sincronizado:`, data)
  return NextResponse.json({ success: true, result: data })
}
