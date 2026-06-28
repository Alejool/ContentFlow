import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BusinessInfoStep from '@/Components/Onboarding/BusinessInfoStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/Components/common/Modern/Button', () => ({
  default: ({ children, type, ...props }: any) => <button type={type} {...props}>{children}</button>,
}));

vi.mock('@/Components/common/Modern/Input', () => ({
  default: ({ label, value, onChange, error, id }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={onChange} aria-describedby={error ? `${id}-error` : undefined} />
      {error && <span id={`${id}-error`} role="alert">{error}</span>}
    </div>
  ),
}));

vi.mock('@/Components/common/Modern/Select', () => ({
  default: ({ label, value, onChange, error, id, options }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

vi.mock('@/Components/common/Modern/Textarea', () => ({
  default: ({ label, value, onChange, id }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} onChange={onChange} />
    </div>
  ),
}));

describe('BusinessInfoStep', () => {
  const onComplete = vi.fn();
  const onSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields', () => {
    render(<BusinessInfoStep onComplete={onComplete} onSkip={onSkip} />);
    expect(screen.getByLabelText('businessInfo.fields.name')).toBeInTheDocument();
    expect(screen.getByLabelText('businessInfo.fields.industry')).toBeInTheDocument();
    expect(screen.getByText('businessInfo.fields.size')).toBeInTheDocument();
  });

  it('calls onComplete with pre-filled valid data on submit', async () => {
    render(
      <BusinessInfoStep
        onComplete={onComplete}
        onSkip={onSkip}
        initialData={{ businessName: 'Acme Corp', businessIndustry: 'technology', businessSize: 'solo' }}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('businessInfo.continue'));
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Acme Corp',
          businessIndustry: 'technology',
          businessSize: 'solo',
          businessGoals: '',
        }),
      );
    });
  });

  it('updates businessName field on change', async () => {
    render(<BusinessInfoStep onComplete={onComplete} onSkip={onSkip} />);
    const input = screen.getByLabelText('businessInfo.fields.name') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Corp' } });
    });
    expect(input.value).toBe('New Corp');
  });

  it('does not call onComplete when name is empty', async () => {
    render(<BusinessInfoStep onComplete={onComplete} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('businessInfo.continue'));
    await waitFor(() => expect(onComplete).not.toHaveBeenCalled());
  });

  it('pre-fills fields from initialData', () => {
    render(
      <BusinessInfoStep
        onComplete={onComplete}
        onSkip={onSkip}
        initialData={{ businessName: 'Pre-filled Corp', businessIndustry: 'retail', businessSize: 'small' }}
      />,
    );
    expect((screen.getByLabelText('businessInfo.fields.name') as HTMLInputElement).value).toBe('Pre-filled Corp');
  });
});
