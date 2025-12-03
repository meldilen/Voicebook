import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackWidget from '../features/recordings/components/FeedbackWidget';

// Mock для react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'feedback.title': 'Feedback',
        'feedback.instruction': 'Rate your experience',
        'feedback.thankYou': 'Thank you!',
        'feedback.ratings.veryPoor': 'Very Poor',
        'feedback.ratings.poor': 'Poor', 
        'feedback.ratings.average': 'Average',
        'feedback.ratings.good': 'Good',
        'feedback.ratings.excellent': 'Excellent'
      };
      return translations[key] || key;
    }
  })
}));

describe('FeedbackWidget', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders feedback title and instruction', () => {
    render(<FeedbackWidget onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Rate your experience')).toBeInTheDocument();
  });

  test('calls onSubmit with rating value when rating is clicked', () => {
    render(<FeedbackWidget onSubmit={mockOnSubmit} />);
    
    const goodRating = screen.getByText('Good');
    fireEvent.click(goodRating);

    expect(mockOnSubmit).toHaveBeenCalledWith(4);
  });

  test('shows thank you message after submission', () => {
    render(<FeedbackWidget onSubmit={mockOnSubmit} />);
    
    const excellentRating = screen.getByText('Excellent');
    fireEvent.click(excellentRating);

    expect(screen.getByText('Thank you!')).toBeInTheDocument();
    expect(screen.queryByText('Feedback')).not.toBeInTheDocument();
  });
});