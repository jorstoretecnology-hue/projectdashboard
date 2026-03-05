const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Faltan las variables de entorno de Supabase en .env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const email = 'johnjortiz018@gmail.com';
  const newPassword = 'Password123!';

  console.log(`Buscando usuario: ${email}`);

  // 1. Encontrar el usuario
  const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error obteniendo usuarios:", listError);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.error(`Usuario ${email} no encontrado.`);
    return;
  }

  console.log(`Usuario encontrado. ID: ${user.id}. Forzando nueva contraseña...`);

  // 2. Forzar actualización
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword
  });

  if (error) {
    console.error("Error al actualizar contraseña:", error.message);
  } else {
    console.log(`✅ ¡Contraseña restablecida con éxito!`);
    console.log(`NUEVA CONTRASEÑA: ${newPassword}`);
  }
}

resetPassword();
