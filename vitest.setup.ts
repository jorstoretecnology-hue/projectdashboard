import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
      prefetch: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  };
});
