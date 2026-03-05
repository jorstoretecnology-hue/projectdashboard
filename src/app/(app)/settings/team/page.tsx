import { Suspense } from 'react'
import { getTeamMembersAction, getPendingInvitationsAction } from '@/modules/team/actions'
import { InviteMemberDialog } from '@/components/settings/InviteMemberDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Mail, ShieldCheck, User, Clock } from 'lucide-react'

export default async function TeamSettingsPage() {
  const members = await getTeamMembersAction()
  const invitations = await getPendingInvitationsAction()

  return (
    <div className="space-y-6 container mx-auto py-10 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h2>
          <p className="text-muted-foreground text-lg">
            Administra quién tiene acceso a tu organización y sus permisos.
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      <Separator className="my-6" />

      <div className="grid gap-6">
        {/* miembros actuales */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              Miembros Activos
            </CardTitle>
            <CardDescription>Usuarios con acceso actualmente a la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar_url || ''} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {member.full_name?.substring(0, 2).toUpperCase() || member.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-100">{member.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-slate-400 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.app_role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {member.app_role}
                    </Badge>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <User className="h-10 w-10 mx-auto opacity-20 mb-2" />
                  <p>No se encontraron miembros en el equipo.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invitaciones Pendientes */}
        {invitations.length > 0 && (
          <Card className="bg-slate-950 border-slate-800 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Invitaciones Pendientes
              </CardTitle>
              <CardDescription>Personas que aún no han aceptado su invitación.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-md bg-slate-900/30 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-slate-800">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{invite.email}</p>
                        <p className="text-xs text-slate-500">Expira el {new Date(invite.expires_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-slate-700 text-slate-400 capitalize">
                      {invite.app_role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
