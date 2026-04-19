import type { CreateCustomerDTO, UpdateCustomerDTO, CustomerQueryDTO } from '@/lib/api/schemas/customers';

import type { Customer } from '../types';

/**
 * Interfaz del Repositorio de Clientes
 * 
 * Aplicación del Principio de Inversión de Dependencia (SOLID - DIP).
 * Esta interfaz permite desacoplar la lógica de negocio de la implementación
 * específica de la base de datos, facilitando el testing y el cambio de proveedor.
 */
export interface ICustomerRepository {
  /**
   * Listar clientes con paginación y filtros
   */
  findAll(
    tenantId: string,
    query: CustomerQueryDTO
  ): Promise<{
    data: Customer[];
    meta: {
      page: number;
      limit: number;
      total: number | null;
      total_pages: number;
    };
  }>;

  /**
   * Buscar un cliente por ID
   */
  findById(id: string, tenantId: string): Promise<Customer | null>;

  /**
   * Buscar un cliente por email en el contexto del tenant
   */
  findByEmail(email: string, tenantId: string): Promise<Customer | null>;

  /**
   * Crear un nuevo cliente
   */
  create(data: CreateCustomerDTO & { data_consent_at?: string; data_consent_ip?: string; }, tenantId: string): Promise<Customer>;

  /**
   * Actualizar un cliente existente
   */
  update(id: string, data: UpdateCustomerDTO, tenantId: string): Promise<Customer>;

  /**
   * Eliminar un cliente
   */
  delete(id: string, tenantId: string): Promise<void>;
}
