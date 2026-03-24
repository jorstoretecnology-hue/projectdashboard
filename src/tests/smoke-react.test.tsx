import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/button';

describe('React & UI Components', () => {
  it('renders a shadcn button component correctly', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('verifies that tailwind classes are present in the output', () => {
    render(<Button className="bg-primary">Styled</Button>);
    const button = screen.getByRole('button', { name: /styled/i });
    // Verificamos que al menos contenga clases base descriptivas
    expect(button.className).toContain('inline-flex');
  });
});
