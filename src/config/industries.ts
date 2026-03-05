/**
 * Motor de Configuración por Industrias (Entry Point)
 * 
 * Este archivo ahora sirve como un hub para la estructura modular en ./industries/
 */

export * from './industries/index';
export * from './industries/types';

import { 
  INDUSTRIES_CONFIG as MODULAR_CONFIG,
  getIndustryConfig as getModularConfig,
  validateIndustryMetadata as validateModularMetadata
} from './industries/index';

// Re-exportar con los nombres originales para evitar breaking changes masivos
export const INDUSTRIES_CONFIG = MODULAR_CONFIG;
export const getIndustryConfig = getModularConfig;

import { z } from 'zod';
import { IndustryType } from './industries/types';

export function validateIndustryMetadata(industryType: IndustryType, metadata: any): boolean {
  try {
    const config = getModularConfig(industryType);
    if (!config) return false;
    
    const schema = z.object(
      Object.fromEntries(
        config.fields.map(field => [
          field.key,
          field.required ? (field.validation || z.any()) : (field.validation || z.any()).optional()
        ])
      )
    );
    schema.parse(metadata);
    return true;
  } catch {
    return false;
  }
}
