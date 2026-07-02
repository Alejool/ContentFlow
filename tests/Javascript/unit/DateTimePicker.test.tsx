import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateTimePicker } from '@/Components/Calendar/DateTimePicker';
import '@testing-library/jest-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

// Initialize i18n for tests — empty resources, so the component falls back to
// the English default strings passed as t() fallbacks.
i18n.init({
  lng: 'es',
  resources: {
    es: {
      translation: {},
    },
  },
});

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Always-future date so past-date validation never fires as time passes
const futureDate = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
})();

describe('DateTimePicker Component', () => {
  it('should render the date picker', () => {
    const mockOnChange = vi.fn();

    renderWithI18n(
      <DateTimePicker
        selectedDate={futureDate}
        onChange={mockOnChange}
      />
    );

    // Check that the selected date is displayed
    expect(screen.getByText(/Selected date:/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show error for past dates', () => {
    const mockOnChange = vi.fn();
    const pastDate = new Date('2020-01-01T10:00:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={pastDate}
        onChange={mockOnChange}
      />
    );

    // Check that the past-date error is displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Cannot Schedule in the Past/i)).toBeInTheDocument();
  });

  it('should not show error for future dates', () => {
    const mockOnChange = vi.fn();

    renderWithI18n(
      <DateTimePicker
        selectedDate={futureDate}
        onChange={mockOnChange}
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should display the formatted selected date', () => {
    const mockOnChange = vi.fn();

    renderWithI18n(
      <DateTimePicker
        selectedDate={futureDate}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/Selected date:/i)).toBeInTheDocument();
  });
});
