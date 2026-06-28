import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from '@/Components/common/Modern/ColorPicker';

describe('ColorPicker — rendering', () => {
  it('renders the trigger button with current color hex', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    expect(screen.getByText('#6366F1')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} label="Role color" />);
    expect(screen.getByText('Role color')).toBeInTheDocument();
  });

  it('renders error when provided', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} error="Invalid color" />);
    expect(screen.getByText('Invalid color')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} disabled />);
    const btn = screen.getByRole('button', { name: /open color/i });
    expect(btn).toBeDisabled();
  });
});

describe('ColorPicker — dropdown', () => {
  it('opens dropdown on click', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /open color/i });
    fireEvent.click(btn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows preset swatches when open', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));
    expect(screen.getByText('Presets')).toBeInTheDocument();
  });

  it('shows HEX input when open', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));
    expect(screen.getByPlaceholderText('#000000')).toBeInTheDocument();
  });

  it('closes when clicking outside', () => {
    render(
      <div>
        <ColorPicker value="#6366f1" onChange={vi.fn()} />
        <button data-testid="outside">outside</button>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('ColorPicker — interactions', () => {
  it('calls onChange when a preset is clicked', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#6366f1" onChange={onChange} presets={['#ef4444', '#10b981']} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    // Find preset buttons (they have background-color style)
    const presetBtns = screen.getAllByRole('button');
    // The first preset button (after trigger + possible others)
    const presetBtn = presetBtns.find((b) => b.getAttribute('title') === '#ef4444');
    expect(presetBtn).toBeDefined();
    fireEvent.click(presetBtn!);

    expect(onChange).toHaveBeenCalledWith('#ef4444');
  });

  it('calls onChange with valid hex when typed in hex input', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#6366f1" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    const hexInput = screen.getByPlaceholderText('#000000');
    fireEvent.change(hexInput, { target: { value: '#ef4444' } });

    expect(onChange).toHaveBeenCalledWith('#ef4444');
  });

  it('does NOT call onChange with invalid hex', () => {
    const onChange = vi.fn();
    render(<ColorPicker value="#6366f1" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    const hexInput = screen.getByPlaceholderText('#000000');
    fireEvent.change(hexInput, { target: { value: '#xyz' } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid hex in input', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    const hexInput = screen.getByPlaceholderText('#000000');
    fireEvent.change(hexInput, { target: { value: 'notacolor' } });

    expect(screen.getByText('Enter a valid hex (#rrggbb)')).toBeInTheDocument();
  });

  it('closes dropdown after selecting a preset', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} presets={['#ef4444']} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    const presetBtn = screen.getByTitle('#ef4444');
    fireEvent.click(presetBtn);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('syncs hex draft when value prop changes externally', () => {
    const { rerender } = render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open color/i }));

    rerender(<ColorPicker value="#ef4444" onChange={vi.fn()} />);

    const hexInput = screen.getByPlaceholderText('#000000') as HTMLInputElement;
    expect(hexInput.value).toBe('#ef4444');
  });
});

describe('ColorPicker — accessibility', () => {
  it('button has aria-haspopup and aria-expanded', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /open color/i });
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('aria-expanded becomes true when open', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /open color/i });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('label is associated with the trigger button via htmlFor', () => {
    render(<ColorPicker value="#6366f1" onChange={vi.fn()} label="Pick color" id="cp-test" />);
    const label = screen.getByText('Pick color');
    expect(label).toHaveAttribute('for', 'cp-test');
  });
});
