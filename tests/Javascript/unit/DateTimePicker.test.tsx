import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateTimePicker } from '@/Components/Calendar/DateTimePicker';
import '@testing-library/jest-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

// Initialize i18n for tests
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

describe('DateTimePicker Component', () => {
  it('should render the date picker', () => {
    const mockOnChange = vi.fn();
    const testDate = new Date('2026-03-15T10:00:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={testDate}
        onChange={mockOnChange}
      />
    );

    // Check that the selected date is displayed
    expect(screen.getByText(/Fecha seleccionada:/i)).toBeInTheDocument();
  });

  it('should show warning for past dates', () => {
    const mockOnChange = vi.fn();
    const pastDate = new Date('2020-01-01T10:00:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={pastDate}
        onChange={mockOnChange}
        showWarningForPastDates={true}
      />
    );

    // Check that warning is displayed
    expect(screen.getByText(/Advertencia: Fecha en el pasado/i)).toBeInTheDocument();
  });

  it('should not show warning when showWarningForPastDates is false', () => {
    const mockOnChange = vi.fn();
    const pastDate = new Date('2020-01-01T10:00:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={pastDate}
        onChange={mockOnChange}
        showWarningForPastDates={false}
      />
    );

    // Check that warning is NOT displayed
    expect(screen.queryByText(/Advertencia: Fecha en el pasado/i)).not.toBeInTheDocument();
  });

  it('should display selected date in Spanish format', () => {
    const mockOnChange = vi.fn();
    const testDate = new Date('2026-03-15T14:30:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={testDate}
        onChange={mockOnChange}
      />
    );

    // The date should be formatted in Spanish
    expect(screen.getByText(/Fecha seleccionada:/i)).toBeInTheDocument();
  });
});
