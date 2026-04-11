'use client';

import { useState } from 'react';
import { Mail, UserPlus, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { invitationService } from '@/modules/admin/services/invitation.service';
import { AppRole } from '@/types';

interface InvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
}

export function InvitationDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName,
}: InvitationDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('OWNER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const invitation = await invitationService.createInvitation({
        email,
        tenantId,
        role,
      });

      // Generar el link real (usando el origin actual)
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${origin}/auth/invite?token=${invitation.token}`;
      setInvitationLink(link);

      toast.success('Invitación Generada', {
        description: `Se ha creado un enlace de acceso para ${email}`,
      });
    } catch (error) {
      console.error('[InvitationDialog] Error creating invitation:', error);
      const message =
        error instanceof Error ? error.message : 'Verifica los permisos de la tabla invitaciones.';
      toast.error('Error al crear invitación', {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          setInvitationLink(null);
          setEmail('');
        }
      }}
    >
      <DialogContent className="sm:max-w-[450px] border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <UserPlus className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">Invitar al Dueño</DialogTitle>
          <DialogDescription>
            Cree un enlace de registro seguro para{' '}
            <span className="font-bold text-foreground">{tenantName}</span>.
          </DialogDescription>
        </DialogHeader>

        {!invitationLink ? (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  Email del Invitado
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    className="pl-10 bg-background/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Rol Asignado
                </Label>
                <Select value={role} onValueChange={(val) => setRole(val as AppRole)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Seleccionar rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNER">Owner (Dueño de negocio)</SelectItem>
                    <SelectItem value="ADMIN">Admin (Administrador)</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee (Empleado)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  El Owner tendrá control total sobre este cliente específico.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 shadow-lg shadow-primary/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Generando...'
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Generar Enlace de Registro
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-6 pt-4 animate-in zoom-in-95 duration-300">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <Label className="text-xs font-bold uppercase text-primary">
                Enlace de Invitación
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={invitationLink}
                  className="bg-background border-primary/20 text-xs font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                  aria-label={copied ? 'Enlace copiado' : 'Copiar enlace'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Comparte este link con el cliente. Expira en 7 días.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="default" className="w-full gap-2" onClick={copyToClipboard}>
                {copied ? '¡Copiado!' : 'Copiar Enlace'}
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={() => setInvitationLink(null)}
              >
                Crear otra invitación
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
