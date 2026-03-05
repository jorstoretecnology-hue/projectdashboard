import { render } from '@testing-library/react';
import React from 'react';

function Placeholder() {
  return <div data-testid="placeholder">ok</div>;
}

describe('React rendering', () => {
  it('renders a basic component', () => {
    const { getByTestId } = render(<Placeholder />);
    expect(getByTestId('placeholder')).toHaveTextContent('ok');
  });
});
