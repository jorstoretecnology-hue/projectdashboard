"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Trash2, Image as ImageIcon, Plus, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"

interface InspectionCameraProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  suggestedPhotos?: string[]
}

export function InspectionCamera({ photos, onPhotosChange, suggestedPhotos = [] }: InspectionCameraProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onPhotosChange([...photos, reader.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* Grid de Fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square group">
            <img 
              src={photo} 
              alt={`Inspección ${index + 1}`} 
              className="w-full h-full object-cover rounded-xl border border-primary/10"
            />
            <button
              onClick={() => removePhoto(index)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Botón de Captura */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl hover:bg-primary/5 transition-colors group"
        >
          <div className="bg-primary/10 p-3 rounded-full mb-2 group-hover:bg-primary/20 transition-colors">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <span className="text-[10px] font-bold text-primary uppercase">Capturar Foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            ref={fileInputRef}
            onChange={handleCapture}
          />
        </button>
      </div>

      {/* Sugerencias de Fotos */}
      {suggestedPhotos.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-xl border border-primary/5">
          <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <ImageIcon className="w-3 h-3" /> Fotos Recomendadas
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestedPhotos.map((item) => {
              const hasPhoto = photos.length > suggestedPhotos.indexOf(item)
              return (
                <div 
                  key={item}
                  className={`px-3 py-1.5 rounded-full text-[11px] flex items-center gap-1.5 border transition-colors ${
                    hasPhoto 
                      ? "bg-primary/10 border-primary/20 text-primary" 
                      : "bg-background border-muted text-muted-foreground"
                  }`}
                >
                  {hasPhoto && <CheckCircle2 className="w-3 h-3" />}
                  {item}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
