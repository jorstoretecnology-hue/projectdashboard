// Archivo: src/app/api/admin/users/route.ts
// [Backend Agent] - IAM Nivel Agencia
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

// Helper para validar seguridad
async function validateSuperadmin() {
  const supabaseClient = await createClient();

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) return { error: 'No autorizado', status: 401 };

  const { data: isSuperadmin, error: rpcError } = await supabaseClient.rpc('is_superadmin');
  if (rpcError || !isSuperadmin) return { error: 'Privilegios insuficientes (Requiere Superadmin)', status: 403 };

  return { supabaseClient, user };
}

// Instancia global admin para usar en endpoints
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: Request) {
  try {
    const authStatus = await validateSuperadmin();
    if (authStatus.error) return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { email, password, name, role = 'USER' } = body;
    console.log(`[API/Admin/Users] Solicitud para crear usuario: ${email} con rol ${role}. Password length: ${password?.length || 0}`);

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'Password123!',
      email_confirm: true,
      user_metadata: { 
        full_name: name,
        app_role: role 
      },
      app_metadata: {
        role: role.toUpperCase(),
        app_role: role.toUpperCase()
      }
    });

    if (createError) {
      console.error('[API/Admin/Users] Full Auth Error:', createError);
      return NextResponse.json({ 
        error: createError.message,
        details: createError 
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: { id: newUser?.user?.id, email: newUser?.user?.email } }, { status: 201 });
  } catch (err: any) {
    console.error('[API/Admin/Users] Excepción Crítica en Servidor:', err);
    return NextResponse.json({ 
      error: 'Error interno de servidor', 
      message: err.message
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authStatus = await validateSuperadmin();
    if (authStatus.error) return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId, role } = body; 

    if (!userId || !role) return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });

    const { data: groupSystem } = await supabaseAdmin.from('security_groups').select('id').eq('name', 'group_system').single();
    if (!groupSystem) return NextResponse.json({ error: 'Grupo base no encontrado' }, { status: 500 });

    const isSuperAdmin = role === 'SUPER_ADMIN';
    
    if (isSuperAdmin) {
      await supabaseAdmin.from('user_groups').upsert({ user_id: userId, group_id: groupSystem.id });
    } else {
      await supabaseAdmin.from('user_groups').delete().eq('user_id', userId).eq('group_id', groupSystem.id);
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ app_role: role.toUpperCase() })
      .eq('id', userId);

    if (updateError) throw updateError;

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { 
        role: role.toUpperCase(),
        app_role: role.toUpperCase()
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno', details: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authStatus = await validateSuperadmin();
    if (authStatus.error) return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno', details: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authStatus = await validateSuperadmin();
    if (authStatus.error) return NextResponse.json({ error: authStatus.error }, { status: authStatus.status });

    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { userId, tenantId } = body;

    if (!userId) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });

    const { data: profile } = await supabaseAdmin.from('profiles').select('app_role').eq('id', userId).single();
    if (profile?.app_role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Un SuperAdmin debe permanecer con acceso GLOBAL' }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ tenant_id: tenantId || null })
      .eq('id', userId);

    if (updateError) throw updateError;

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: tenantId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error al asignar empresa', details: err.message }, { status: 500 });
  }
}
