"use client"

import { useState } from "react"
import { SignaturePad } from "./SignaturePad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { CheckCircle2, UserCheck, ShieldCheck, Loader2 } from "lucide-react"

interface DeliveryModuleProps {
  saleId: string
  token: string
  customerDocument?: string
  onDeliveryComplete: () => void
}

export function DeliveryModule({ saleId, token, customerDocument, onDeliveryComplete }: DeliveryModuleProps) {
  const [step, setStep] = useState<1 | 2>(1) // 1: Validacion Id, 2: Firma
  const [document, setDocument] = useState("")
  const [signature, setSignature] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerifyIdentity = () => {
    // Si el cliente tiene un documento registrado, validar contra él. 
    // Si no, permitir cualquier documento (el usuario capturará el que presente el cliente)
    if (customerDocument && document !== customerDocument) {
      return toast.error("El número de documento no coincide con el registrado.")
    }
    
    if (document.length < 5) {
      return toast.error("Por favor ingrese un número de documento válido.")
    }

    setStep(2)
    toast.success("Identidad validada. Proceda con la firma.")
  }

  const handleFinalize = async () => {
    if (!signature) return toast.error("La firma es obligatoria para la entrega.")

    setIsSubmitting(true)
    try {
      const resp = await fetch(`/api/v1/public/tracking/${token}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document, 
          signature,
          delivered_at: new Date().toISOString()
        })
      })

      if (!resp.ok) throw new Error("Error al procesar la entrega")

      toast.success("¡Entrega confirmada satisfactoriamente!")
      onDeliveryComplete()
    } catch (error) {
      toast.error("Hubo un problema al confirmar la entrega.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-primary/20 shadow-xl rounded-3xl overflow-hidden bg-gradient-to-b from-primary/5 to-white">
      <CardContent className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-black uppercase text-primary">Confirmación de Entrega</h3>
          <p className="text-sm text-muted-foreground">Valide su identidad para finalizar el proceso.</p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Número de Documento / ID</Label>
              <Input 
                placeholder="Ej: 12345678" 
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                className="h-14 text-lg border-2 focus-visible:ring-primary rounded-2xl"
              />
            </div>
            <Button className="w-full h-14 rounded-2xl font-bold text-lg" onClick={handleVerifyIdentity}>
              VERIFICAR IDENTIDAD <UserCheck className="ml-2 w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div className="text-xs">
                <p className="font-bold text-primary">ID VALIDADO: {document}</p>
                <p className="text-muted-foreground">Por favor, firme abajo para confirmar el recibido.</p>
              </div>
            </div>

            <SignaturePad 
              onSave={setSignature} 
              onClear={() => setSignature(null)} 
            />

            <div className="flex gap-4">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(1)}>
                VOLVER
              </Button>
              <Button 
                className="flex-[2] h-12 rounded-xl font-black" 
                onClick={handleFinalize}
                disabled={isSubmitting || !signature}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "CONFIRMAR RECIBIDO"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
