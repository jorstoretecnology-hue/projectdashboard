'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent,SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { inviteMemberAction } from '@/modules/team/actions'

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'staff' | 'user'>('user')

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await inviteMemberAction(email, role)
      toast.success(`Invitación enviada a ${email}`)
      setOpen(false)
      setEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la invitación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Invitar Miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Invitar al Equipo</DialogTitle>
          <DialogDescription className="text-slate-400">
            Envía una invitación por correo electrónico para unirse a tu organización.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-950 border-slate-700"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role" className="text-slate-200">Rol</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="user">Usuario (Lectura)</SelectItem>
                  <SelectItem value="staff">Staff (Operativo)</SelectItem>
                  <SelectItem value="admin">Administrador (Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Invitación'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
