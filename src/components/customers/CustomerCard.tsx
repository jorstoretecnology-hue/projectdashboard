import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Customer } from "@/modules/customers/actions"
import { Mail, Phone } from "lucide-react"

interface CustomerCardProps {
  customer: Customer
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Avatar>
          <AvatarImage src="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <CardTitle className="text-base font-medium truncate">
            {customer.firstName} {customer.lastName}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 pt-2">
            {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {customer.phone}
                </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                 <Mail className="h-3 w-3" /> {customer.email}
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
