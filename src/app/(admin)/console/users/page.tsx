'use client';

import { useEffect, useState } from 'react';
import { useUserManagement, UserProfile } from '@/hooks/useUserManagement';
import { Users, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AdminUsersPage() {
  const { users, tenants, isLoading, fetchUsers, fetchTenants, assignTenant, updateUserRole, createUser, deleteUser } = useUserManagement();
  
  // Estado para el formulario de nuevo usuario
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('ADMIN'); // Por defecto Administrador de Empresa
  const [showModal, setShowModal] = useState(false);

  const ROLE_LABELS: Record<string, string> = {
    'SUPER_ADMIN': 'SuperAdmin',
    'ADMIN': 'Administrador de Empresa',
    'OWNER': 'Administrador de Empresa',
    'EMPLOYEE': 'Empleado',
    'VIEWER': 'Solo Lectura'
  };

  const ROLE_OPTIONS = [
    { key: 'SUPER_ADMIN', label: 'SuperAdmin', color: 'text-amber-500' },
    { key: 'ADMIN', label: 'Admin', color: 'text-blue-400' },
    { key: 'EMPLOYEE', label: 'Empleado', color: 'text-gray-400' },
    { key: 'VIEWER', label: 'Lector', color: 'text-gray-500' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, [fetchUsers, fetchTenants]);

  // Componente de UI solo activo para members reales del group_system
  // (La API ya bloquea esto, pero agregamos capa UI para mejor UX).
  
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    logger.log('[UI] Intentando crear usuario', { email: newEmail, role: newRole });
    try {
      await createUser(newEmail, newName, newRole, newPassword);
      setShowModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewName('');
    } catch (err) {
      console.error('[UI] Error en handleCreateSubmit:', err);
      // El error ya se muestra vía toast en el hook
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">
            Gestión IAM (Nivel Agencia)
          </h1>
          <p className="text-gray-400">
            Administra los usuarios globales y sus niveles de acceso al sistema.
          </p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Usuario</th>
                <th className="p-4 font-semibold text-center">Empresa / Tenant</th>
                <th className="p-4 font-semibold text-right">Rol & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">Cargando usuarios...</td>
                </tr>
              ) : (
                users.map((user: UserProfile) => (
                  <tr key={user.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                           {user.email.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <div className="font-medium text-white">{user.full_name || 'Sin Nombre'}</div>
                           <div className="text-sm text-gray-400">{user.email}</div>
                         </div>
                       </div>
                     </td><td className="p-4">
                       <div className="flex flex-col gap-2">
                         {user.app_role === 'SUPER_ADMIN' ? (
                           <div className="flex justify-center">
                             <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold border border-amber-500/20">
                               GLOBAL / AGENCIA
                             </span>
                           </div>
                         ) : (
                           <div className="relative group/search">
                             <select 
                               value={user.tenant_id || ''}
                               onChange={(e) => assignTenant(user.id, e.target.value || null)}
                               className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-8 transition-all hover:border-gray-500"
                             >
                               <option value="">🔍 Buscar Empresa / Global...</option>
                               {tenants.map(t => (
                                 <option key={t.id} value={t.id}>{t.name}</option>
                               ))}
                             </select>
                             <div className="absolute right-3 top-2 pointer-events-none text-gray-500 group-hover/search:text-gray-300 transition-colors">
                               <Users className="w-4 h-4" />
                             </div>
                           </div>
                         )}
                       </div>
                    </td><td className="p-4">
                      <div className="flex items-center justify-end gap-6">
                        <div className="hidden lg:flex items-center gap-2 bg-gray-950/50 p-1 rounded-xl border border-gray-800">
                          {ROLE_OPTIONS.map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => updateUserRole(user.id, opt.key as any)}
                              disabled={isLoading}
                               className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                                 (user.app_role === opt.key || (opt.key === 'ADMIN' && user.app_role === 'OWNER'))
                                   ? 'bg-indigo-600 text-white shadow-lg' 
                                   : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                               }`}
                               title={opt.label}
                             >
                               {opt.label}
                             </button>
                           ))}
                         </div>
                         
                         <div className="lg:hidden">
                            <span className="text-xs font-bold text-indigo-400">{ROLE_LABELS[user.app_role]}</span>
                         </div>
                         
                         <button
                           onClick={() => {
                             if (confirm('¿Estás seguro de eliminar permanentemente esta cuenta global?')) {
                               deleteUser(user.id);
                             }
                           }}
                           disabled={isLoading}
                           className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                           title="Eliminar Cuenta"
                         >
                           <Trash2 className="w-5 h-5" />
                         </button>
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Crear Nuevo Perfil IAM</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
                <input 
                  type="email" required
                  value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="ejemplo@agencia.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre Completo</label>
                <input 
                  type="text"
                  value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                <input 
                  type="password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-[10px] text-gray-500 mt-1">Si se deja vacío, se usará 'Password123!'</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rol de Acceso</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <label 
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        newRole === key 
                          ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      <input 
                        type="radio"
                        name="role"
                        value={key}
                        checked={newRole === key}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        newRole === key ? 'border-indigo-500' : 'border-gray-600'
                      }`}>
                        {newRole === key && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                  {isLoading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
