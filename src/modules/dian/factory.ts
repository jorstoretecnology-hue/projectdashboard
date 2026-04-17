import { AlegraProvider } from './providers/alegra-provider'
import type { DianProvider, ProviderSlug } from './types'

const PROVIDER_REGISTRY: Record<string, new () => DianProvider> = {
  alegra: AlegraProvider,
}

export function createProvider(slug: ProviderSlug): DianProvider {
  const Ctor = PROVIDER_REGISTRY[slug]
  if (!Ctor) {
    throw new Error(`Provider "${slug}" is not registered.`)
  }
  return new Ctor()
}
