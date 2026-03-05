// v3 - Uses Service Role for public access (Server Component only - key never exposed)
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import { Timeline } from "@/components/sales/Timeline"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Camera, ClipboardCheck, Package, Clock, User, Hash, Calendar } from "lucide-react"

interface TrackingPageProps {
  params: Promise<{ id: string }>
}

// Service Role client for public read-only access (Server Component - never exposed to browser)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { id } = await params
  const supabase = getServiceClient()
  
  // Obtener la venta con service role (bypass RLS para lectura pública)
  const { data: sale, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(*),
      items:sale_items(*)
    `)
    .eq('id', id)
    .single()

  if (error || !sale) {
    console.error("Error fetching sale:", error)
    return notFound()
  }

  // Formatear fecha
  const date = new Date(sale.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // Extraer metadata del taller
  const workshopData = sale.metadata || {}
  const inspectionPhotos = workshopData.inspection_photos || []
  const checklist = workshopData.checklist || {}

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header Premium */}
      <div className="bg-slate-900 text-white py-12 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                <Hash size={16} />
                <span className="text-sm font-mono">{id}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Seguimiento de Orden</h1>
              <p className="text-slate-400">Consulta el estado real de tu servicio en nuestro taller</p>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <User className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cliente</p>
                  <p className="font-medium">{sale.customer?.first_name} {sale.customer?.last_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Estados y Timeline */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="bg-white p-6 md:p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="text-blue-500" size={24} />
                    Progreso del Servicio
                  </h2>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-semibold border-blue-200 bg-blue-50 text-blue-700">
                    {sale.state}
                  </Badge>
                </div>
                <Timeline currentState={sale.state} updatedAt={sale.updated_at} />
              </div>
            </Card>

            {/* Inspección Visual (Fotos) */}
            {inspectionPhotos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Camera className="text-slate-600" size={20} />
                  Inspección Visual de Recepción
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inspectionPhotos.map((url: string, idx: number) => (
                    <Card key={idx} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                      <img 
                        src={url} 
                        alt={`Inspección ${idx + 1}`} 
                        className="w-full h-64 object-cover"
                      />
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalles y Checklist */}
          <div className="space-y-8">
            {/* Checklist Técnico */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <ClipboardCheck className="text-green-500" size={20} />
                  Checklist de Seguridad
                </h3>
                <div className="space-y-4">
                  {Object.entries(checklist).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-600 capitalize">{key}</span>
                      <Badge className={
                        value === 'BIEN' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                        value === 'MAL' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                        'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                      }>
                        {value as string}
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(checklist).length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-4">
                      Checklist pendiente de revisión técnica
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de la Orden */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
               <div className="bg-slate-50 px-6 py-4 border-b">
                 <h3 className="font-bold">Resumen de Servicios</h3>
               </div>
               <CardContent className="p-6">
                  <div className="space-y-4">
                    {sale.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold">{item.product_name || 'Servicio'}</p>
                          <p className="text-xs text-slate-500">Cant: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-mono">${item.subtotal}</p>
                      </div>
                    ))}
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-mono">${sale.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total estim.</span>
                        <span className="text-blue-600">${sale.total || sale.subtotal}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-xs">Fecha de recepción: {date}</span>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
