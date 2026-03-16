import { SaasMetricsService } from "@/modules/admin/services/saas-metrics.service"
import DashboardClient from "./DashboardClient"
import { AlertTriangle, Crown } from "lucide-react"

/**
 * SaaS Executive Dashboard (Server Component)
 * Esta versión carga todos los datos directamente en el servidor
 * para máxima velocidad y SEO.
 */
export default async function SaasExecutiveDashboardPage() {
  const saasMetricsService = new SaasMetricsService()
  
  try {
    // OPTIMIZACIÓN: Fetch de todo el snapshot en un solo paso
    const data = await saasMetricsService.getDashboardSnapshot()

    return <DashboardClient data={data} />
  } catch (err) {
    console.error("Dashboard Server Error:", err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-2xl font-bold text-white">Error al cargar el Dashboard</h2>
        <p className="text-slate-400">Hubo un problema al procesar las métricas en el servidor.</p>
      </div>
    )
  }
}

// Desactivar caché estática para que siempre sea tiempo real
export const revalidate = 0
export const dynamic = 'force-dynamic'
