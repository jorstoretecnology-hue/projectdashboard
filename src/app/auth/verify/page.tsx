"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { VerifyForm } from "./VerifyForm"

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams?.get("email") || ""
  const type = (searchParams?.get("type") as "signup" | "recovery" | "magiclink") || "signup"

  const handleVerified = () => {
    window.location.href = "/post-auth"
  }

  return <VerifyForm email={email} type={type} onVerified={handleVerified} />
}

export default function VerifyPage() {
  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0 text-white">
        <Image
          src="/images/login-bg.png"
          alt="Premium Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/60 to-slate-950/90" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center p-6">
        <Suspense fallback={<Loader2 className="animate-spin text-primary" />}>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  )
}
