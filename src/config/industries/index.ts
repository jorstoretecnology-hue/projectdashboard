import { tallerConfig } from './taller';
import { restauranteConfig } from './restaurante';
import { supermercadoConfig } from './supermercado';
import { ferreteriaConfig } from './ferreteria';
import { gymConfig } from './gym';
import { glampingConfig } from './glamping';
import { discotecaConfig } from './discoteca';
import { IndustryConfig } from './types';

export * from './types';

export const INDUSTRIES_CONFIG: Record<string, IndustryConfig> = {
  taller: tallerConfig,
  restaurante: restauranteConfig,
  supermercado: supermercadoConfig,
  ferreteria: ferreteriaConfig,
  gym: gymConfig,
  glamping: glampingConfig,
  discoteca: discotecaConfig,
};

export function getIndustryConfig(industryType: string): IndustryConfig {
  return INDUSTRIES_CONFIG[industryType];
}

export function getAllIndustries(): IndustryConfig[] {
  return Object.values(INDUSTRIES_CONFIG);
}

export function validateIndustryMetadata(industryType: string, metadata: any): boolean {
  // Implementación simplificada si es necesario, o importada
  return true; 
}
