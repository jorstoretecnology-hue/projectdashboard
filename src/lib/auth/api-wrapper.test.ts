import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from './api-wrapper';

// Mock del cliente Supabase
const mockGetUser = vi.fn();
const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null })), // Default empty profile
      })),
    })),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('withAuth Wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if no user session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') });
    
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const req = new NextRequest('http://localhost/api/test');
    
    const res = await wrapped(req);
    const body = await res.json();
    
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('AUTH_REQUIRED');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should return 403 if no tenant associated (and profile lookup fails)', async () => {
    mockGetUser.mockResolvedValue({ 
      data: { 
        user: { 
          id: 'user-123', 
          app_metadata: {}, 
          user_metadata: {} 
        } 
      }, 
      error: null 
    });
    
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const req = new NextRequest('http://localhost/api/test');
    
    const res = await wrapped(req);
    const body = await res.json();
    
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('NO_TENANT');
  });

  it('should allow access with valid context and default role (from metadata)', async () => {
     mockGetUser.mockResolvedValue({ 
      data: { 
        user: { 
          id: 'user-123', 
          app_metadata: { tenant_id: 'tenant-abc' }, 
          user_metadata: {} 
        } 
      }, 
      error: null 
    });

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrapped = withAuth(handler);
    const req = new NextRequest('http://localhost/api/test');

    const res = await wrapped(req);
    
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
    const ctx = handler.mock.calls[0][1];
    expect(ctx.user.id).toBe('user-123');
    expect(ctx.tenantId).toBe('tenant-abc');
    expect(ctx.userRole).toBe('VIEWER'); // Default role logic
  });
  
  it('should enforce required roles', async () => {
     mockGetUser.mockResolvedValue({ 
      data: { 
        user: { 
          id: 'user-123', 
          app_metadata: { 
            tenant_id: 'tenant-abc',
            app_role: 'VIEWER' 
          }, 
          user_metadata: {} 
        } 
      }, 
      error: null 
    });

    const handler = vi.fn();
    // Wrap requiring ADMIN role
    const wrapped = withAuth(handler, { requiredRoles: ['ADMIN'] });
    const req = new NextRequest('http://localhost/api/test');

    const res = await wrapped(req);
    const body = await res.json();
    
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    expect(handler).not.toHaveBeenCalled();
  });
});
