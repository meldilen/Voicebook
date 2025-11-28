import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomSheet from '../features/BottomSheet/BottomSheet';

describe('BottomSheet', () => {
  const mockOnClose = jest.fn();
  const mockOnOpen = jest.fn();
  const mockOnTogglePeek = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnOpen.mockClear();
    mockOnTogglePeek.mockClear();
  });

  test('renders children content when open', () => {
    render(
      <BottomSheet 
        isOpen={true}
        isPeek={false}
        onClose={mockOnClose}
      >
        <div data-testid="test-content">Sheet Content</div>
      </BottomSheet>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Sheet Content')).toBeInTheDocument();
  });

  test('calls onClose when overlay is clicked', () => {
    render(
      <BottomSheet 
        isOpen={true}
        isPeek={false}
        onClose={mockOnClose}
      >
        <div>Content</div>
      </BottomSheet>
    );

    const overlay = document.querySelector('.bottom-sheet-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not render when not open and not peek on desktop', () => {
    const { container } = render(
      <BottomSheet 
        isOpen={false}
        isPeek={false}
        onClose={mockOnClose}
      >
        <div>Content</div>
      </BottomSheet>
    );

    // Проверяем что ничего не рендерится
    expect(container.firstChild).toBeNull();
  });
});