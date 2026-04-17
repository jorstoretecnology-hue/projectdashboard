// Archivo: src/app/api/admin/users/route.ts
// [Backend Agent] - IAM Nivel Agencia
import crypto from 'crypto';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';



// ─── CAMBIO 1: Validación ULTRA SIMPLE — solo JWT app_metadata, sin DB ───
async function validateSuperadmin() {
  const supabaseClient = await createClient();

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    console.log(`[API/Admin/Users][validateSuperadmin] ❌ No autenticado:`, authError?.message);
    return { error: 'No autorizado', status: 401 };
  }

  // El JWT app_metadata es la "llave maestra" — no buscar en profiles ni validar tenant_id
  const appRole = String(user.app_metadata?.app_role || user.app_metadata?.role || '').toLowerCase();
  console.log(`[API/Admin/Users][validateSuperadmin] User: ${user.id}, app_role: "${appRole}"`);

  if (appRole !== 'superadmin' && appRole !== 'super_admin') {
    console.log(`[API/Admin/Users][validateSuperadmin] ❌ Role insuficiente: ${appRole}`);
    return { error: 'Privilegios insuficientes (Requiere Superadmin)', status: 403 };
  }

  console.log(`[API/Admin/Users][validateSuperadmin] ✅ Superadmin validado`);
  return { user };
}

// CAMBIO 2: Cliente admin independiente — NO usa auth del cliente, SIEMPRE service_role
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`[API/Admin/Users][getAdminClient] URL: ${url?.substring(0, 25)}..., Key: ${key ? '✅ presente' : '❌ AUSENTE'}`);

  if (!url || !key) {
    throw new Error(`SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL no configurados. URL: ${!!url}, Key: ${!!key}`);
  }

  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(request: Request) {
  console.log(`\n[API/Admin/Users][POST] ── Inicio request ──`);
  try {
    const authStatus = await validateSuperadmin();
    if ('error' in authStatus) {
      console.log(`[API/Admin/Users][POST] ❌ Auth falló:`, authStatus.error);
      return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });
    }

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { email, password, name, role = 'USER' } = body;
    console.log(`[API/Admin/Users][POST] Creando usuario: ${email}, rol: ${role}`);

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || crypto.randomBytes(16).toString('hex'),
      email_confirm: true,
      user_metadata: { full_name: name, app_role: role },
      app_metadata: { role: role.toUpperCase(), app_role: role.toUpperCase() }
    });

    if (createError) {
      console.log(`[API/Admin/Users][POST] ❌ Error creando:`, createError.message);
      return NextResponse.json({ error: createError.message, details: createError }, { status: 400 });
    }

    console.log(`[API/Admin/Users][POST] ✅ Usuario creado: ${newUser?.user?.id}`);
    return NextResponse.json({ success: true, user: { id: newUser?.user?.id, email: newUser?.user?.email } }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    console.log(`[API/Admin/Users][POST] ❌ EXCEPTION:`, error.message);
    logger.error('[API/Admin/Users] Excepción Crítica en Servidor', { error });
    return NextResponse.json({ error: 'Error interno de servidor', message: error.message, details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  console.log(`\n[API/Admin/Users][PUT] ── Inicio request ──`);
  try {
    const authStatus = await validateSuperadmin();
    if ('error' in authStatus) {
      console.log(`[API/Admin/Users][PUT] ❌ Auth falló:`, authStatus.error);
      return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });
    }

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId, role } = body;
    console.log(`[API/Admin/Users][PUT] userId: ${userId}, role: ${role}`);

    if (!userId || !role) {
      console.log(`[API/Admin/Users][PUT] ❌ Datos inválidos`);
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    console.log(`[API/Admin/Users][PUT] Buscando security_groups.group_system...`);
    const { data: groupSystem, error: groupError } = await supabaseAdmin
      .from('security_groups')
      .select('id')
      .eq('name', 'group_system')
      .single();

    if (!groupSystem || groupError) {
      console.log(`[API/Admin/Users][PUT] ❌ Grupo no encontrado:`, groupError?.message || 'null data');
      return NextResponse.json({ error: 'Grupo base no encontrado', details: groupError?.message || 'security_groups.group_system missing' }, { status: 500 });
    }
    console.log(`[API/Admin/Users][PUT] ✅ Grupo encontrado: ${groupSystem.id}`);

    const isSuperAdmin = role.toUpperCase() === 'SUPER_ADMIN';
    if (isSuperAdmin) {
      console.log(`[API/Admin/Users][PUT] Upsert a user_groups...`);
      await supabaseAdmin.from('user_groups').upsert({ user_id: userId, group_id: groupSystem.id });
    } else {
      console.log(`[API/Admin/Users][PUT] Delete de user_groups...`);
      await supabaseAdmin.from('user_groups').delete().eq('user_id', userId).eq('group_id', groupSystem.id);
    }

    console.log(`[API/Admin/Users][PUT] Actualizando profiles.app_role...`);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ app_role: role.toUpperCase() })
      .eq('id', userId);

    if (updateError) {
      console.log(`[API/Admin/Users][PUT] ❌ Error actualizando profile:`, updateError.message);
      throw updateError;
    }

    console.log(`[API/Admin/Users][PUT] Actualizando auth admin metadata...`);
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: role.toUpperCase(), app_role: role.toUpperCase() }
    });

    console.log(`[API/Admin/Users][PUT] ✅ Rol actualizado`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.log(`[API/Admin/Users][PUT] ❌ EXCEPTION:`, error.message);
    logger.error('[API/Admin/Users] PUT Error', { error });
    return NextResponse.json({ error: 'Error al actualizar rol', message: error.message, details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  console.log(`\n[API/Admin/Users][DELETE] ── Inicio request ──`);
  try {
    const authStatus = await validateSuperadmin();
    if ('error' in authStatus) {
      console.log(`[API/Admin/Users][DELETE] ❌ Auth falló:`, authStatus.error);
      return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });
    }

    const supabaseAdmin = getAdminClient();

    // Aceptar userId tanto del body como de query params (algunos browsers strip DELETE body)
    let userId: string | undefined;
    const url = new URL(request.url);
    userId = url.searchParams.get('userId') || undefined;

    if (!userId) {
      try {
        const body = await request.json();
        userId = body?.userId;
      } catch {
        // No hay body JSON
      }
    }

    console.log(`[API/Admin/Users][DELETE] userId recibido: ${userId || '(no encontrado)'}`);

    if (!userId) {
      console.log(`[API/Admin/Users][DELETE] ❌ ID requerido (ni en body ni query params)`);
      return NextResponse.json({ error: 'ID de usuario requerido (enviar como body.userId o ?userId=...)' }, { status: 400 });
    }

    console.log(`[API/Admin/Users][DELETE] Intentando eliminar directamente con auth.admin.deleteUser...`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError?.message === 'User not found' || deleteError?.message?.includes('not found')) {
      // 2. Buscar el auth_user_id real en la tabla profiles
      console.log(`[API/Admin/Users][DELETE] Usuario no encontrado en auth.users, buscando en profiles...`);
      
      const supabase = await createClient(); // cliente normal (con contexto del usuario logueado)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (profileError || !profile?.id) {
        console.error('[API/Admin/Users][DELETE] ❌ Perfil no encontrado:', profileError?.message || 'null data');
        return NextResponse.json({ error: 'Usuario no encontrado en auth.users ni en profiles' }, { status: 404 });
      }
      
      console.log('[API/Admin/Users][DELETE] ✅ auth_user_id encontrado en profiles:', profile.id);
      
      // Reintentar con el ID real de auth
      const { error: retryError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);
      if (retryError) {
        console.error('[API/Admin/Users][DELETE] ❌ Error eliminando con auth_user_id:', retryError.message);
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }
    } else if (deleteError) {
      console.error('[API/Admin/Users][DELETE] ❌ Error inesperado:', deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('[API/Admin/Users][DELETE] ✅ Usuario eliminado correctamente');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.log(`[API/Admin/Users][DELETE] ❌ EXCEPTION:`, error.message);
    logger.error('[API/Admin/Users] DELETE Error', { error });
    return NextResponse.json({ error: 'Error al eliminar usuario', message: error.message, details: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  console.log(`\n[API/Admin/Users][PATCH] ── Inicio request ──`);
  try {
    const authStatus = await validateSuperadmin();
    if ('error' in authStatus) {
      console.log(`[API/Admin/Users][PATCH] ❌ Auth falló:`, authStatus.error);
      return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });
    }

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId, tenantId } = body;
    console.log(`[API/Admin/Users][PATCH] userId: ${userId}, tenantId: ${tenantId}`);

    if (!userId) {
      console.log(`[API/Admin/Users][PATCH] ❌ ID requerido`);
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    console.log(`[API/Admin/Users][PATCH] Verificando profile...`);
    const { data: profile } = await supabaseAdmin.from('profiles').select('app_role').eq('id', userId).single();
    if (profile?.app_role === 'SUPER_ADMIN') {
      console.log(`[API/Admin/Users][PATCH] ❌ No se puede modificar SuperAdmin`);
      return NextResponse.json({ error: 'Un SuperAdmin debe permanecer con acceso GLOBAL' }, { status: 403 });
    }

    console.log(`[API/Admin/Users][PATCH] Actualizando tenant_id...`);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ tenant_id: tenantId || null })
      .eq('id', userId);

    if (updateError) {
      console.log(`[API/Admin/Users][PATCH] ❌ Error actualizando:`, updateError.message);
      throw updateError;
    }

    console.log(`[API/Admin/Users][PATCH] Actualizando auth metadata...`);
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: tenantId }
    });

    console.log(`[API/Admin/Users][PATCH] ✅ Tenant asignado`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.log(`[API/Admin/Users][PATCH] ❌ EXCEPTION:`, error.message);
    logger.error('[API/Admin/Users] PATCH Error', { error });
    return NextResponse.json({ error: 'Error al asignar empresa', message: error.message, details: String(error) }, { status: 500 });
  }
}
