"use client"

import { useState, useCallback } from "react"

export function useQuotaError() {
  const [quotaResource, setQuotaResource] = useState<string | null>(null)

  const handleQuotaError = useCallback((error: Error | { message?: string }) => {
    // Detectar si el error es de Quota Engine normalizado
    // Formato esperado: Error message string que incluye "QUOTA_EXCEEDED" 
    // O un objeto estructurado si el servicio lo devuelve así.
    // Actualmente los servicios lanzan new Error("QUOTA_EXCEEDED: ...")

    const message = error?.message || ""
    
    if (message.includes("QUOTA_EXCEEDED")) {
      // Extraer el resource key del mensaje si es posible, o usar un default
      // Formato: "QUOTA_EXCEEDED: Resource 'maxInventoryItems' limit..."
      
      const match = message.match(/'([^']+)'/)
      const resource = match ? match[1] : "unknown"
      
      setQuotaResource(resource)
      return true
    }

    return false
  }, [])

  const resetQuotaError = useCallback(() => {
    setQuotaResource(null)
  }, [])

  return {
    quotaResource, // Si tiene valor, mostrar dialog
    handleQuotaError,
    resetQuotaError,
  }
}
