import { PERMISSIONS } from "@/config/permissions"
// Re-exportar schemas y tipos unificados desde lib/api/schemas/customers
export {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  CustomerStatusEnum,
  IdentificationTypeEnum,
  type CreateCustomerDTO,
  type UpdateCustomerDTO,
  type CustomerQueryDTO,
  type Customer,
  type CustomerFormValues,
  toDbCustomer,
  fromDbCustomer,
} from '@/lib/api/schemas/customers'

/**
 * Action Contract - Customers
 */
export const CUSTOMERS_ACTIONS = {
  create: {
    key: "create",
    label: "Nuevo Cliente",
    permission: PERMISSIONS.CUSTOMERS_CREATE,
    ui: "dialog",
  },
} as const
