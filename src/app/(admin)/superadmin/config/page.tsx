"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Settings2, 
  ShieldCheck, 
  Database, 
  Search, 
  RefreshCcw,
  ShieldAlert,
  Save,
  Trash2,
  CheckCircle2
} from "lucide-react"
import { adminProfilesService, GlobalProfile } from "@/modules/admin/services/admin-profiles.service"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function ConfigPage() {
  const [profiles, setProfiles] = useState<GlobalProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const data = await adminProfilesService.listProfiles()
      setProfiles(data)
    } catch (error) {
      toast.error("Error al cargar perfiles")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await adminProfilesService.updateRole(userId, newRole)
      toast.success("Rol actualizado correctamente")
      // Opción: Recargar localmente para no hacer fetch completo
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, app_role: newRole } : p))
    } catch (error) {
      toast.error("Error al actualizar rol")
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive'
      case 'ADMIN': return 'default'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings2 className="w-8 h-8 text-primary" />
            Configuración del Sistema
          </h1>
          <p className="text-slate-400 mt-1">Gestión global de usuarios, roles y parámetros maestros.</p>
        </div>
        <Button onClick={loadProfiles} variant="outline" size="sm" className="gap-2">
          <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
          Sincronizar Datos
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-slate-900 border-slate-800 p-1 h-12">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary">
            <Users size={18} />
            Usuarios Globales
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 data-[state=active]:bg-primary">
            <ShieldCheck size={18} />
            Planes y Reglas
          </TabsTrigger>
          <TabsTrigger value="db" className="gap-2 data-[state=active]:bg-primary">
            <Database size={18} />
            Mantenimiento DB
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Gestión de Perfiles Globales</CardTitle>
                  <CardDescription>Visualiza y administra todos los usuarios registrados en la plataforma.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Buscar por nombre o ID..." 
                    className="pl-9 bg-slate-950 border-slate-700" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-950/50">
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tenant Asociado</TableHead>
                      <TableHead>Rol Actual</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10">Cargando...</TableCell></TableRow>
                    ) : filteredProfiles.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10">No se encontraron usuarios.</TableCell></TableRow>
                    ) : filteredProfiles.map((p) => (
                      <TableRow key={p.id} className="hover:bg-slate-800/20 border-slate-800">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-200">{p.full_name || 'Sin nombre'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.tenants?.name ? (
                            <Badge variant="outline" className="bg-slate-800/30 text-slate-300 border-slate-700">
                              {p.tenants.name}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Global / Sin Empresa</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(p.app_role)}>
                            {p.app_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select 
                            defaultValue={p.app_role} 
                            onValueChange={(val) => handleUpdateRole(p.id, val)}
                          >
                            <SelectTrigger className="w-32 bg-slate-950 border-slate-700 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                              <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                              <SelectItem value="ADMIN">ADMIN</SelectItem>
                              <SelectItem value="OWNER">OWNER</SelectItem>
                              <SelectItem value="EMPLOYEE">EMPLOYEE</SelectItem>
                              <SelectItem value="VIEWER">VIEWER</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-4">
          <div className="grid md:grid-row-2 gap-4">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-yellow-500" />
                  Mantenimiento de Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium">Modo Mantenimiento</h4>
                    <p className="text-xs text-slate-500 italic">Impide el acceso a usuarios que no sean SUPER_ADMIN.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Inactivo</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <h4 className="text-sm font-medium">Registro Público</h4>
                    <p className="text-xs text-slate-500">Permite que nuevos usuarios creen sus propias empresas.</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-green-500/10 text-green-500 border-green-500/20">Activo</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="db" className="mt-6">
           <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase tracking-tighter text-sm font-black">
                  <Database className="w-5 h-5 text-blue-500" />
                  Database Health & Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-2">
                    <p className="text-xs text-blue-300">
                      Utiliza estas herramientas para sincronizar estados corruptos o limpiar cachés del lado del servidor.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                       <Button size="sm" variant="secondary" className="text-xs h-7">Cache Purge</Button>
                       <Button size="sm" variant="secondary" className="text-xs h-7">Re-sync JWT Claims</Button>
                       <Button size="sm" variant="destructive" className="text-xs h-7">Nuke Sessions</Button>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
