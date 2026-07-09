import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateTimePicker } from '@/Components/Calendar/DateTimePicker';
import '@testing-library/jest-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import es from '@/locales/es/index';

// Initialize i18n with the real Spanish translation bundle, so keys like
// calendar.selected_date resolve to actual copy instead of falling back to
// the English default passed as the second argument to t().
i18n.init({
  lng: 'es',
  resources: {
    es: {
      translation: es,
    },
  },
});

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

// Always a year out so the test never crosses into the past as real time advances.
const futureDate = (hours: number, minutes: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

describe('DateTimePicker Component', () => {
  it('should render the date picker', () => {
    const mockOnChange = vi.fn();
    const testDate = futureDate(10, 0);

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

    // Check that the past-date validation alert is displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/No se Puede Programar en el Pasado/i)).toBeInTheDocument();
  });

  it('always shows the past-date warning regardless of showWarningForPastDates', () => {
    // showWarningForPastDates is accepted for backwards compatibility but is
    // no longer wired to anything in the component (see the `_` prefix on
    // the destructured prop) — past-date validation is always on.
    const mockOnChange = vi.fn();
    const pastDate = new Date('2020-01-01T10:00:00');

    renderWithI18n(
      <DateTimePicker
        selectedDate={pastDate}
        onChange={mockOnChange}
        showWarningForPastDates={false}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should display selected date in Spanish format', () => {
    const mockOnChange = vi.fn();
    const testDate = futureDate(14, 30);

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
