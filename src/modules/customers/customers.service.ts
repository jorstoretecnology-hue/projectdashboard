import { ICustomerRepository } from './interfaces/ICustomerRepository';
import { CreateCustomerDTO, UpdateCustomerDTO, CustomerQueryDTO } from '@/lib/api/schemas/customers';

/**
 * Servicio de Clientes - Lógica de Negocio
 * 
 * Aplicación del Principio de Inversión de Dependencia (SOLID - DIP).
 * Este servicio recibe un ICustomerRepository en lugar de depender directamente
 * de SupabaseClient, lo que permite:
 * 1. Testing más fácil (mocks del repositorio)
 * 2. Cambio de proveedor de base de datos sin tocar esta capa
 * 3. Lógica de negocio pura y desacoplada
 */
export class CustomersService {
  constructor(
    private repository: ICustomerRepository,
    private tenantId: string
  ) {}

  /**
   * Listar clientes con búsqueda avanzada
   */
  async getCustomers(query: CustomerQueryDTO) {
    return this.repository.findAll(this.tenantId, query);
  }

  /**
   * Obtener un cliente por ID
   */
  async getCustomerById(id: string) {
    const customer = await this.repository.findById(id, this.tenantId);
    
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    return customer;
  }

  /**
   * Crear un nuevo cliente
   * Valida que el email sea único en el tenant
   */
  async createCustomer(data: CreateCustomerDTO) {
    // Validación de negocio: email único
    const existing = await this.repository.findByEmail(data.email, this.tenantId);

    if (existing) {
      throw new Error(`Customer with email ${data.email} already exists`);
    }

    return this.repository.create(data, this.tenantId);
  }

  /**
   * Actualizar un cliente existente
   */
  async updateCustomer(id: string, data: UpdateCustomerDTO) {
    // Verificar que el cliente existe
    await this.getCustomerById(id);

    return this.repository.update(id, data, this.tenantId);
  }

  /**
   * Eliminar un cliente
   */
  async deleteCustomer(id: string) {
    // Verificar que el cliente existe
    await this.getCustomerById(id);

    await this.repository.delete(id, this.tenantId);
    
    return { success: true };
  }
}
