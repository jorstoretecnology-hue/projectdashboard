import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

// Mocks
const mockHandleMPWebhook = vi.fn();
vi.mock('@/lib/mercadopago/webhook-handler', () => ({
  handleMPWebhook: (payload: any) => mockHandleMPWebhook(payload),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MercadoPago Webhook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 and call handler on valid payment notification', async () => {
    const payload = {
      type: 'payment',
      data: { id: 'mp-payment-123' },
    };

    mockHandleMPWebhook.mockResolvedValue({ success: true });

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
    expect(mockHandleMPWebhook).toHaveBeenCalledWith(payload);
  });

  it('should return 200 even if handler fails (to avoid retries) but log the error', async () => {
    const payload = {
      type: 'payment',
      data: { id: 'mp-payment-failed' },
    };

    mockHandleMPWebhook.mockResolvedValue({ success: false, error: 'Database connection failed' });

    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('logged_with_error');
    expect(json.message).toBe('Database connection failed');
  });

  it('should return 500 on critical error', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
