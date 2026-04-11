'use client';

import { 
  Plus, 
  Users, 
  ShieldAlert, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  UserCircle,
  Search,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTenant } from '@/providers';
import { cn } from '@/lib/utils';

// Mock inicial de usuarios
const INITIAL_USERS = [
  { id: 1, name: 'Juan Pérez', email: 'juan.perez@acme.com', role: 'Administrador', status: 'Activo', initial: 'JP' },
  { id: 2, name: 'Ana García', email: 'ana.garcia@acme.com', role: 'Editor', status: 'Activo', initial: 'AG' },
  { id: 3, name: 'Carlos López', email: 'carlos.lopez@acme.com', role: 'Visualizador', status: 'Inactivo', initial: 'CL' },
  { id: 4, name: 'Elena Rivas', email: 'elena.rivas@acme.com', role: 'Editor', status: 'Activo', initial: 'ER' },
  { id: 5, name: 'Marcos Ruiz', email: 'marcos.ruiz@acme.com', role: 'Visualizador', status: 'Pendiente', initial: 'MR' },
];

export default function UsersPage() {
  const { currentTenant } = useTenant();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Estado para el nuevo usuario
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Visualizador' });
  
  // Estado para el usuario que se está editando o eliminando
  const [editingUser, setEditingUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);

  // 1. Filtro de Seguridad
  const isModuleActive = useMemo(() => {
    return currentTenant?.activeModules.includes('Users');
  }, [currentTenant]);

  // 2. Búsqueda Real
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Handlers CRUD
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const userToAdd = {
      id: Date.now(),
      ...newUser,
      status: 'Activo',
      initial: newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    };

    setUsers([userToAdd, ...users]);
    setNewUser({ name: '', email: '', role: 'Visualizador' });
    setIsAddDialogOpen(false);
    toast.success(`Usuario ${newUser.name} creado correctamente`);
  };

  const handleEditUser = (user: { id: number; name: string; email: string; role: string }) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser?.name || !editingUser?.email) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setUsers(users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          initial: editingUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        };
      }
      return u;
    }));

    setIsEditDialogOpen(false);
    setEditingUser(null);
    toast.success('Usuario actualizado correctamente');
  };

  const confirmDeleteUser = (user: { id: number; name: string }) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    
    setUsers(users.filter(u => u.id !== userToDelete.id));
    toast.success(`Usuario ${userToDelete.name} eliminado`);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const toggleStatus = (id: number) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        const newStatus = u.status === 'Activo' ? 'Inactivo' : 'Activo';
        toast.info(`Estado de ${u.name} cambiado a ${newStatus}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  if (!isModuleActive) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/20 bg-destructive/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
              <ShieldAlert size={32} />
            </div>
            <CardTitle className="text-2xl text-destructive font-bold">Acceso Denegado</CardTitle>
            <CardDescription className="text-destructive/80 font-medium">
              El módulo de <strong>Gestión de Usuarios</strong> no está incluido en el plan actual de {currentTenant?.name || 'este cliente'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              variant="outline" 
              className="border-destructive/30 hover:bg-destructive/10 text-destructive"
              onClick={() => window.location.href = '/'}
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-6 rounded-2xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
            <Users size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
            <p className="text-muted-foreground font-medium">Control de accesos y roles para {currentTenant?.name}</p>
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6">
              <UserPlus size={18} />
              <span className="font-bold">Añadir Usuario</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Añade un nuevo miembro al equipo de {currentTenant?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Ej: John Doe" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rol del Sistema</Label>
                <Select 
                   value={newUser.role} 
                   onValueChange={v => setNewUser({...newUser, role: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddUser}>Guardar Usuario</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Filtros */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Buscar por nombre o email..." 
          className="pl-10 rounded-xl bg-card border-border/50"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabla de Usuarios */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-md shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px] font-bold">Nombre</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="font-bold">Rol</TableHead>
                <TableHead className="font-bold">Estado</TableHead>
                <TableHead className="text-right font-bold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm ring-1 ring-primary/20">
                          {user.initial}
                        </div>
                        <span className="group-hover:text-primary transition-colors">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} className="opacity-50" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className={cn(
                          "opacity-50",
                          user.role === 'Administrador' ? "text-primary opacity-100" : ""
                        )} />
                        <span className={cn(
                          user.role === 'Administrador' ? "font-bold text-primary" : "font-medium"
                        )}>
                          {user.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.status === 'Activo' ? 'default' : user.status === 'Inactivo' ? 'destructive' : 'secondary'}
                        className={cn(
                          "rounded-full px-2 text-[10px] font-bold uppercase tracking-wider cursor-pointer",
                          user.status === 'Pendiente' && "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}
                        onClick={() => toggleStatus(user.id)}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Abrir menú de usuario">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl w-40">
                          <DropdownMenuLabel className="text-xs uppercase text-muted-foreground font-bold">Opciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditUser(user)}>
                            <UserCircle size={14}/> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => toggleStatus(user.id)}>
                            {user.status === 'Activo' ? <XCircle size={14}/> : <CheckCircle size={14}/>}
                            {user.status === 'Activo' ? 'Suspender' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => confirmDeleteUser({ id: user.id, name: user.name })}
                          >
                            <Trash2 size={14}/> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Search size={40} className="opacity-10" />
                       <p>No se encontraron usuarios que coincidan con tu búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil de Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre Completo</Label>
              <Input 
                id="edit-name" 
                placeholder="Ej: John Doe" 
                value={editingUser?.name || ''}
                onChange={e => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Correo Electrónico</Label>
              <Input 
                id="edit-email" 
                type="email" 
                placeholder="john@example.com"
                value={editingUser?.email || ''}
                onChange={e => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rol del Sistema</Label>
              <Select 
                 value={editingUser?.role || ''} 
                 onValueChange={v => setEditingUser(prev => prev ? {...prev, role: v} : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Administrador">Administrador</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Visualizador">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateUser}>Actualizar Datos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al usuario 
              <strong> {userToDelete?.name}</strong> y quitará su acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              Eliminar Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
