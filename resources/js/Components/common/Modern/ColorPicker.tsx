import { useState, useRef, useEffect, useId } from 'react';
import { Check, ChevronDown, Pipette, X } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  /** Show a row of preset swatches. Defaults to a curated palette. */
  presets?: string[];
  /** Show hex input field */
  showHexInput?: boolean;
}

const DEFAULT_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#64748b', '#1e293b',
];

/** Validate hex string — returns true for #rrggbb */
function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

/** WCAG contrast — returns white or dark for legibility on the given bg */
function contrastText(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = [r, g, b]
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    })
    .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i]!, 0);
  return (1.05) / (lum + 0.05) >= 4.5 ? '#ffffff' : '#111827';
}

export default function ColorPicker({
  value,
  onChange,
  label,
  error,
  disabled = false,
  id: propId,
  presets = DEFAULT_PRESETS,
  showHexInput = true,
}: ColorPickerProps) {
  const uid = useId();
  const id = propId ?? uid;

  const [open, setOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);

  const nativeRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync draft when value changes externally
  useEffect(() => {
    setHexDraft(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleHexInput = (raw: string) => {
    const normalized = raw.startsWith('#') ? raw : `#${raw}`;
    setHexDraft(normalized);
    if (isValidHex(normalized)) {
      onChange(normalized);
    }
  };

  const handlePreset = (hex: string) => {
    onChange(hex);
    setHexDraft(hex);
    setOpen(false);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    onChange(hex);
    setHexDraft(hex);
  };

  const safeColor = isValidHex(value) ? value : '#6366f1';
  const onColor = contrastText(safeColor);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={[
          'flex h-10 w-full items-center gap-2.5 rounded-lg border px-3 text-sm transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          error
            ? 'border-red-500 focus:ring-red-400'
            : open
              ? 'border-primary-500 focus:ring-primary-400 dark:border-primary-500'
              : 'border-gray-300 hover:border-gray-400 dark:border-neutral-600 dark:hover:border-neutral-500',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer bg-white dark:bg-theme-bg-secondary',
        ].join(' ')}
        aria-label="Open color picker"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {/* Color swatch */}
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: safeColor }}
        >
          <Check className="h-3 w-3 opacity-0" style={{ color: onColor }} />
        </span>

        {/* Hex value */}
        <span className="flex-1 text-left font-mono text-xs tracking-wider text-gray-700 dark:text-neutral-300">
          {safeColor.toUpperCase()}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Error */}
      {error && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <X className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Color picker"
          className="absolute z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-theme-bg-secondary"
        >
          {/* Large color preview */}
          <div
            className="flex h-16 w-full items-end justify-between p-3"
            style={{ backgroundColor: safeColor }}
          >
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
              style={{
                backgroundColor: `${safeColor}33`,
                color: onColor,
                backdropFilter: 'blur(4px)',
              }}
            >
              {safeColor.toUpperCase()}
            </span>

            {/* Native color picker trigger */}
            <button
              type="button"
              onClick={() => nativeRef.current?.click()}
              className="rounded-lg p-1.5 transition-colors hover:bg-black/10"
              title="Open color wheel"
            >
              <Pipette className="h-4 w-4" style={{ color: onColor }} />
            </button>
            <input
              ref={nativeRef}
              type="color"
              value={safeColor}
              onChange={handleNativeChange}
              className="sr-only"
              tabIndex={-1}
            />
          </div>

          {/* Preset swatches */}
          <div className="p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
              Presets
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {presets.map((preset) => {
                const isActive = preset.toLowerCase() === safeColor.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    title={preset}
                    className={[
                      'h-8 w-full rounded-md transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1',
                      isActive ? 'scale-110 ring-2 ring-offset-1 ring-gray-900/30 dark:ring-white/30' : '',
                    ].join(' ')}
                    style={{ backgroundColor: preset }}
                  >
                    {isActive && (
                      <Check className="mx-auto h-3.5 w-3.5" style={{ color: contrastText(preset) }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hex input */}
          {showHexInput && (
            <div className="border-t border-gray-100 p-3 dark:border-neutral-700">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                HEX
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 shrink-0 rounded-md ring-1 ring-black/10"
                  style={{ backgroundColor: isValidHex(hexDraft) ? hexDraft : '#e5e7eb' }}
                />
                <input
                  type="text"
                  value={hexDraft}
                  onChange={(e) => handleHexInput(e.target.value)}
                  maxLength={7}
                  placeholder="#000000"
                  className={[
                    'flex-1 rounded-md border px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1',
                    isValidHex(hexDraft)
                      ? 'border-gray-300 focus:border-primary-500 focus:ring-primary-400 dark:border-neutral-600'
                      : 'border-red-400 focus:border-red-500 focus:ring-red-400',
                    'dark:bg-neutral-800 dark:text-white',
                  ].join(' ')}
                />
              </div>
              {!isValidHex(hexDraft) && (
                <p className="mt-1 text-[10px] text-red-500">Enter a valid hex (#rrggbb)</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
