'use client'

import { Loader2, Plug, Send, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  saveProviderConfig,
  sendInvoiceToDian,
  testProviderConnection,
} from '@/modules/dian/actions'
import type { InvoiceLogEntry, ProviderSlug, Environment } from '@/modules/dian/types'

interface DianConfigClientProps {
  initialLogs: InvoiceLogEntry[]
}

export function DianConfigClient({ initialLogs }: DianConfigClientProps) {
  const [providerSlug, setProviderSlug] = useState<ProviderSlug>('alegra')
  const [environment, setEnvironment] = useState<Environment>('test')
  const [credentials, setCredentials] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [logs, setLogs] = useState<InvoiceLogEntry[]>(initialLogs)

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }))
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await testProviderConnection(providerSlug, credentials)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      toast.error('Error al probar la conexión')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await saveProviderConfig(providerSlug, environment, credentials)
      if (result.success) {
        toast.success('Configuración guardada correctamente')
      } else {
        toast.error(result.error ?? 'Error al guardar')
      }
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleSendInvoice = async (saleId: string) => {
    setSending(saleId)
    try {
      const result = await sendInvoiceToDian(saleId)
      if (result.success) {
        toast.success(`Factura enviada. CUDE: ${result.cude ?? result.invoiceNumber ?? 'N/A'}`)
        // Refresh logs
        const { getProviderLogs } = await import('@/modules/dian/actions')
        const updated = await getProviderLogs()
        setLogs(updated)
      } else {
        toast.error(result.error ?? 'Error al enviar factura')
      }
    } catch {
      toast.error('Error al enviar la factura a la DIAN')
    } finally {
      setSending(null)
    }
  }

  const alegraFields = [
    { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'tu-api-key' },
    { key: 'domain', label: 'Dominio (opcional)', type: 'text', placeholder: 'https://api.alegra.com' },
  ]

  const siigoFields = [
    { key: 'username', label: 'Usuario', type: 'text', placeholder: 'usuario@siigo.com' },
    { key: 'password', label: 'Contraseña', type: 'password', placeholder: '••••••••' },
    { key: 'subscription', label: 'Suscripción', type: 'text', placeholder: 'subscription-id' },
  ]

  const fields = providerSlug === 'alegra' ? alegraFields : siigoFields

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación Electrónica (DIAN)</h1>
        <p className="text-muted-foreground text-sm">
          Configura tu proveedor de facturación electrónica y envía facturas a la DIAN.
        </p>
      </div>

      {/* Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Configuración del Proveedor
          </CardTitle>
          <CardDescription>
            Selecciona el proveedor y ambiente, luego ingresa las credenciales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider & Environment Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select
                value={providerSlug}
                onValueChange={(v) => setProviderSlug(v as ProviderSlug)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alegra">Alegra</SelectItem>
                  <SelectItem value="siigo">Siigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select
                value={environment}
                onValueChange={(v) => setEnvironment(v as Environment)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Pruebas</SelectItem>
                  <SelectItem value="production">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Credential Fields */}
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.key] ?? ''}
                  onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
              Probar Conexión
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Guardar Configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Send */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Factura Individual</CardTitle>
          <CardDescription>
            Ingresa el ID de la venta para generar y enviar la factura electrónica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickSendForm onSend={handleSendInvoice} sendingId={sending} />
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Operaciones</CardTitle>
          <CardDescription>
            Últimas {logs.length} operaciones registradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8" />
              <p>No hay operaciones registradas aún.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>CUDE / ID Proveedor</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.created_at).toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.operation}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" /> Éxito
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" /> Fallido
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">
                      {log.cude ?? log.provider_invoice_id ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                      {log.error_message ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Quick Send Form
// ─────────────────────────────────────────────────────────────

function QuickSendForm({
  onSend,
  sendingId,
}: {
  onSend: (saleId: string) => void
  sendingId: string | null
}) {
  const [saleId, setSaleId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!saleId.trim()) return
    onSend(saleId.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        placeholder="ID de la venta (UUID)"
        value={saleId}
        onChange={(e) => setSaleId(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={sendingId !== null}>
        {sendingId ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Enviar a DIAN
      </Button>
    </form>
  )
}
