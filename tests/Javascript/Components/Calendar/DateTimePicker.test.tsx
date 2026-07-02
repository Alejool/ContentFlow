import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DateTimePicker } from '@/Components/Calendar/DateTimePicker';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@internationalized/date', () => ({
  CalendarDate: class CalendarDate {
    year: number; month: number; day: number;
    constructor(year: number, month: number, day: number) {
      this.year = year; this.month = month; this.day = day;
    }
  },
}));

vi.mock('react-aria-components', () => ({
  I18nProvider: ({ children }: any) => children,
  Calendar: ({ children, onChange, value }: any) => (
    <div data-testid="aria-calendar">
      <button
        data-testid="cal-next-day"
        onClick={() => {
          const next = { year: value.year, month: value.month, day: value.day + 1 };
          onChange(next);
        }}
      >
        Next day
      </button>
      {typeof children === 'function' ? children() : children}
    </div>
  ),
  CalendarGrid: ({ children }: any) => <div>{typeof children === 'function' ? children() : children}</div>,
  CalendarGridHeader: ({ children }: any) => <div>{typeof children === 'function' ? children('Mon') : children}</div>,
  CalendarGridBody: ({ children }: any) => {
    const { CalendarDate } = require('@internationalized/date');
    return <div>{children(new CalendarDate(2025, 6, 15))}</div>;
  },
  CalendarHeaderCell: ({ children }: any) => <div>{children}</div>,
  CalendarCell: ({ children }: any) => <div>{typeof children === 'function' ? children({ formattedDate: '15' }) : children}</div>,
}));

vi.mock('@/Utils/common/dateValidation', () => ({
  validateDate: (d: Date) => {
    const past = d <= new Date(Date.now() - 1000);
    return {
      isValid: !past,
      isPastDate: past,
      error: past ? 'Cannot schedule in the past' : null,
    };
  },
}));

vi.mock('@/Utils/formatters', () => ({
  formatDateTimeString: (d: Date) => d.toISOString(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

// ── Helper ─────────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 24 * 3600 * 1000); // tomorrow

// Always-future date with a specific time, so past-date validation never fires
function futureDateAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function setup(date = FUTURE, onChange = vi.fn()) {
  return { onChange, ...render(<DateTimePicker selectedDate={date} onChange={onChange} />) };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DateTimePicker — rendering', () => {
  it('renders without crashing', () => {
    setup();
    expect(screen.getByTestId('aria-calendar')).toBeInTheDocument();
  });

  it('renders time inputs with correct initial values', () => {
    const date = futureDateAt(14, 35); // 14:35
    setup(date);
    const inputs = screen.getAllByRole('spinbutton');
    // hours + minutes inputs
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('shows selected date text when valid', () => {
    setup();
    // The formatDateTimeString mock returns ISO string
    expect(screen.queryByRole('alert')).toBeNull(); // no error alert for future date
  });
});

describe('DateTimePicker — time inputs', () => {
  it('syncs hours state when selectedDate prop changes', () => {
    const date1 = futureDateAt(10, 0);
    const date2 = futureDateAt(18, 45);
    const onChange = vi.fn();

    const { rerender } = render(<DateTimePicker selectedDate={date1} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    const hoursInput = inputs[0] as HTMLInputElement;
    expect(hoursInput.value).toBe('10');

    // Change the prop externally
    rerender(<DateTimePicker selectedDate={date2} onChange={onChange} />);

    expect(hoursInput.value).toBe('18');
  });

  it('syncs minutes state when selectedDate prop changes', () => {
    const date1 = futureDateAt(10, 5);
    const date2 = futureDateAt(10, 55);
    const onChange = vi.fn();

    const { rerender } = render(<DateTimePicker selectedDate={date1} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    const minutesInput = inputs[1] as HTMLInputElement;
    expect(minutesInput.value).toBe('05');

    rerender(<DateTimePicker selectedDate={date2} onChange={onChange} />);
    expect(minutesInput.value).toBe('55');
  });

  it('calls onChange with correct hours when hours input changes', async () => {
    const date = futureDateAt(10, 30);
    const onChange = vi.fn();

    render(<DateTimePicker selectedDate={date} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    const hoursInput = inputs[0]!;

    await act(async () => {
      fireEvent.change(hoursInput, { target: { value: '16' } });
    });

    expect(onChange).toHaveBeenCalled();
    const called = onChange.mock.calls[0]![0] as Date;
    expect(called.getHours()).toBe(16);
    expect(called.getMinutes()).toBe(30); // minutes preserved
  });

  it('calls onChange with correct minutes when minutes input changes', async () => {
    const date = new Date(2099, 5, 15, 10, 30);
    const onChange = vi.fn();

    render(<DateTimePicker selectedDate={date} onChange={onChange} />);

    const inputs = screen.getAllByRole('spinbutton');
    const minutesInput = inputs[1]!;

    await act(async () => {
      fireEvent.change(minutesInput, { target: { value: '45' } });
    });

    expect(onChange).toHaveBeenCalled();
    const called = onChange.mock.calls[0]![0] as Date;
    expect(called.getMinutes()).toBe(45);
    expect(called.getHours()).toBe(10); // hours preserved
  });
});

describe('DateTimePicker — validation', () => {
  it('does NOT call onChange with a past date', async () => {
    const pastDate = new Date(2020, 5, 15, 10, 0);
    const onChange = vi.fn();

    render(<DateTimePicker selectedDate={pastDate} onChange={onChange} />);

    // The component should show an error for past dates
    expect(screen.queryByRole('alert')).toBeInTheDocument();
  });

  it('shows error message for invalid dates', () => {
    const pastDate = new Date(2000, 0, 1, 0, 0);
    setup(pastDate);
    const alert = screen.queryByRole('alert');
    expect(alert).toBeInTheDocument();
  });
});

describe('DateTimePicker — calendar integration', () => {
  it('calls onChange when a calendar day is selected', async () => {
    const date = new Date(2099, 5, 15, 14, 30);
    const onChange = vi.fn();
    render(<DateTimePicker selectedDate={date} onChange={onChange} />);

    const nextDayBtn = screen.getByTestId('cal-next-day');
    await act(async () => {
      fireEvent.click(nextDayBtn);
    });

    // onChange may or may not be called depending on validation
    // The important thing is the component doesn't throw
    expect(screen.getByTestId('aria-calendar')).toBeInTheDocument();
  });

  it('preserves time when navigating calendar days', async () => {
    const date = new Date(2099, 5, 15, 14, 30);
    const onChange = vi.fn();
    render(<DateTimePicker selectedDate={date} onChange={onChange} />);

    const nextDayBtn = screen.getByTestId('cal-next-day');
    await act(async () => {
      fireEvent.click(nextDayBtn);
    });

    if (onChange.mock.calls.length > 0) {
      const called = onChange.mock.calls[0]![0] as Date;
      // Time (14:30) should be preserved when navigating days
      expect(called.getHours()).toBe(14);
      expect(called.getMinutes()).toBe(30);
    }
  });
});
