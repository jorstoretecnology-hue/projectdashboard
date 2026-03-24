"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Customer, CustomerFormValues } from "@/modules/customers/types"
import { customersService } from "@/modules/customers/services/customers.service"
import { CustomerForm } from "./CustomerForm"
import { toast } from "sonner"
import { useDebounce } from "use-debounce"

interface CustomerSelectProps {
  value?: string
  onValueChange: (customerId: string) => void
  tenantId: string
  placeholder?: string
}

export function CustomerSelect({
  value,
  onValueChange,
  tenantId,
  placeholder = "Seleccionar cliente..."
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 300)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      const supabase = createClient()
      try {
        let query = supabase
          .from("customers")
          .select("id, first_name, last_name, email, company_name, identification_number")
          .eq("tenant_id", tenantId)
          .limit(10)

        if (debouncedSearch) {
          query = query.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,identification_number.ilike.%${debouncedSearch}%`)
        }

        const { data, error } = await query

        if (error) throw error
        // Transformar de snake_case a camelCase manualmente si no usamos fromDbCustomer
        setCustomers((data || []).map(d => ({
          id: d.id,
          firstName: d.first_name,
          lastName: d.last_name,
          email: d.email,
          companyName: d.company_name,
          identificationNumber: d.identification_number
        } as unknown as Customer)))
      } catch (err) {
        console.error("Error fetching customers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [debouncedSearch, tenantId])

  const handleCreateCustomer = async (data: CustomerFormValues) => {
    try {
      const newCustomer = await customersService.create(data, tenantId)
      setCustomers(prev => [newCustomer, ...prev])
      onValueChange(newCustomer.id)
      setIsAdding(false)
      setOpen(false)
      toast.success("Cliente creado correctamente")
    } catch (err) {
      toast.error("Error al crear el cliente")
    }
  }

  const selectedCustomer = customers.find((c) => c.id === value)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-muted/30 border-primary/10 hover:border-primary/30 transition-all font-normal"
        >
          {selectedCustomer ? (
            <div className="flex flex-col items-start truncate overflow-hidden">
              <span className="font-medium text-sm">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </span>
              <span className="text-[10px] text-muted-foreground truncate w-full">
                {selectedCustomer.identificationNumber || selectedCustomer.email}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar por nombre, email o ID..." 
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Buscando..." : "No se encontraron clientes."}
            </CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={(currentValue: string) => {
                    onValueChange(currentValue)
                    setOpen(false)
                  }}
                  className="flex flex-col items-start py-2"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-sm">
                      {customer.firstName} {customer.lastName}
                    </span>
                    {value === customer.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customer.email} {customer.identificationNumber ? `• ${customer.identificationNumber}` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <div className="p-2 border-t mt-1">
             <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs text-primary" 
                onClick={() => {
                  setIsAdding(true)
                  setOpen(false)
                }}
             >
                <UserPlus className="mr-2 h-3 w-3" />
                Nuevo Cliente
             </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <CustomerForm 
            onSubmit={handleCreateCustomer} 
            onCancel={() => setIsAdding(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
