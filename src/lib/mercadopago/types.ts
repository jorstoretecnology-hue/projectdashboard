export type MPPaymentStatus = 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';

export interface MPWebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice';
  user_id: string;
}

export interface MPPaymentResult {
  id: string;
  status: MPPaymentStatus;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  installments: number;
  payment_method_id: string;
  payment_type_id: string;
}
