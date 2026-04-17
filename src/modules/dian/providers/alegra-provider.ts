import type {
  DianInvoiceInput,
  DianInvoiceResult} from '../types';
import {
  DianProvider
} from '../types'

export class AlegraProvider extends DianProvider {
  readonly slug = 'alegra' as const
  readonly name = 'Alegra'

  private apiKey: string
  private domain: string

  constructor() {
    super()
    this.apiKey = ''
    this.domain = 'https://api.alegra.com'
  }

  configure(credentials: Record<string, string>): void {
    this.apiKey = credentials.apiKey ?? ''
    this.domain = credentials.domain ?? 'https://api.alegra.com'
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    }
  }

  private mapDocumentType(idType: string): string {
    const map: Record<string, string> = {
      CC: '13',
      NIT: '31',
      CE: '22',
      PP: '41',
      NUIP: '13',
    }
    return map[idType] ?? '13'
  }

  async sendInvoice(input: DianInvoiceInput): Promise<DianInvoiceResult> {
    try {
      const payload = {
        third: {
          identification: input.customer.idNumber,
          identificationDocument: {
            type: this.mapDocumentType(input.customer.idType),
          },
          name: input.customer.name,
          email: input.customer.email,
        },
        items: input.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unitPrice,
          tax: item.taxRate > 0 ? [{ id: 1 }] : undefined,
        })),
        payment: {
          method: 'CASH',
        },
      }

      const response = await fetch(`${this.domain}/invoices/v2`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as Record<string, unknown>

      if (!response.ok) {
        return {
          success: false,
          errorMessage: (data.message as string) ?? 'Alegra API error',
          rawResponse: data,
        }
      }

      return {
        success: true,
        invoiceNumber: data.consecutive as string | undefined,
        providerInvoiceId: data.id as string | undefined,
        cude: (data.number as string | undefined)?.toString() ?? (data.consecutive as string | undefined),
        rawResponse: data,
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelInvoice(_: string): Promise<{ success: boolean; errorMessage?: string }> {
    // Alegra does not support cancellation via API for electronic invoices
    // It must be done through a credit note manually
    return {
      success: false,
      errorMessage: 'Cancellation not supported by Alegra API. Create a credit note manually.',
    }
  }
}
