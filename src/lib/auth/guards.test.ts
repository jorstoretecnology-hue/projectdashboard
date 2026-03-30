import { describe, it, expect } from 'vitest';
import { hasRole, requireRole } from './guards';

describe('RBAC Guards', () => {
  describe('hasRole', () => {
    it('should return true if userRole is in allowedRoles', () => {
      expect(hasRole('ADMIN', ['ADMIN', 'OWNER'])).toBe(true);
    });

    it('should return false if userRole is NOT in allowedRoles', () => {
      expect(hasRole('VIEWER', ['ADMIN', 'OWNER'])).toBe(false);
    });

    it('should confirm that UPPERCASE passes and lowercase fails', () => {
      expect(hasRole('ADMIN', ['ADMIN', 'OWNER'])).toBe(true);
      // @ts-expect-error Comportamiento esperado en case-sensitivity
      expect(hasRole('admin', ['ADMIN', 'OWNER'])).toBe(false);
    });

    it('should return true if userRole is SUPER_ADMIN regardless of allowedRoles', () => {
      expect(hasRole('SUPER_ADMIN', ['EMPLOYEE'])).toBe(true);
      expect(hasRole('SUPER_ADMIN', [])).toBe(true);
    });
  });

  describe('requireRole', () => {
    it('should not throw if role is allowed', () => {
      expect(() => requireRole('ADMIN', ['ADMIN'])).not.toThrow();
    });

    it('should throw Error if role is not allowed', () => {
      expect(() => requireRole('VIEWER', ['ADMIN'])).toThrow(/Forbidden/);
    });
  });
});
