import { parseColor } from '@react-stately/color';
import { CheckCircle, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import {
    ColorArea as AriaColorArea,
    Label as AriaLabel,
    ColorSlider,
    ColorThumb,
    SliderTrack
} from 'react-aria-components';

import Label from '@/Components/common/Modern/Label';

interface ColorAreaProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  containerClassName?: string;
  required?: boolean;
  showHexInput?: boolean;
  showSliders?: boolean;
}

export default function ColorArea({
  id = 'color-area',
  label,
  value,
  onChange,
  disabled = false,
  error,
  success,
  hint,
  containerClassName = '',
  required = false,
  showHexInput = true,
  showSliders = true,
}: ColorAreaProps) {
  const [colorValue, setColorValue] = useState(() => {
    try {
      // Parse and convert to HSB for proper hue/saturation/brightness manipulation
      const parsed = parseColor(value);
      return parsed.toFormat('hsb');
    } catch {
      return parseColor('#4f46e5').toFormat('hsb');
    }
  });

  const handleColorChange = (newColor: any) => {
    setColorValue(newColor);
    // Use hex format (without alpha) for backend compatibility
    onChange(newColor.toString('hex'));
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    try {
      const parsed = parseColor(hex);
      const hsbColor = parsed.toFormat('hsb');
      setColorValue(hsbColor);
      onChange(hsbColor.toString('hex'));
    } catch {
      // Invalid color, don't update
    }
  };

  return (
    <div className={containerClassName}>
      {label && (
        <Label
          htmlFor={id}
          size="md"
          required={required}
          error={error}
          success={success}
          variant="default"
          align="left"
          className="mb-2"
        >
          {label}
        </Label>
      )}

      {hint && (
        <p className="mb-2 text-sm text-gray-500 dark:text-neutral-500">{hint}</p>
      )}

      <div className="space-y-4">
        {/* Color Area Picker */}
        <AriaColorArea
          value={colorValue}
          onChange={handleColorChange}
          isDisabled={disabled}
          xChannel="saturation"
          yChannel="brightness"
          className="relative h-48 w-full rounded-lg border-2 border-gray-300 shadow-sm dark:border-neutral-700"
        >
          <ColorThumb className="z-10 h-6 w-6 rounded-full border-2 border-white shadow-lg ring-2 ring-black/20 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-500/50" />
        </AriaColorArea>

        {/* Hue Slider */}
        {showSliders && (
          <div>
            <AriaLabel className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Tono
            </AriaLabel>
            <ColorSlider
              value={colorValue}
              onChange={handleColorChange}
              channel="hue"
              isDisabled={disabled}
              className="relative h-6 w-full"
            >
              <SliderTrack
                className="h-full w-full rounded-lg"
                style={{
                  background:
                    'linear-gradient(to right, rgb(255, 0, 0), rgb(255, 255, 0), rgb(0, 255, 0), rgb(0, 255, 255), rgb(0, 0, 255), rgb(255, 0, 255), rgb(255, 0, 0))',
                }}
              >
                <ColorThumb className="top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ring-2 ring-black/20 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-500/50" />
              </SliderTrack>
            </ColorSlider>
          </div>
        )}

        {/* Hex Input */}
        {showHexInput && (
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 flex-shrink-0 rounded-lg border-2 border-gray-300 shadow-sm dark:border-neutral-700"
              style={{ backgroundColor: colorValue.toString('hex') }}
            />
            <div className="relative flex-1">
              <input
                type="text"
                value={colorValue.toString('hex').toUpperCase()}
                onChange={handleHexInputChange}
                disabled={disabled}
                className={`block h-12 w-full rounded-lg border pl-10 pr-4 font-mono text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  error
                    ? 'border-primary-500 bg-white text-gray-900 focus:ring-primary-500/20 dark:bg-neutral-800 dark:text-white dark:focus:ring-primary-500/30'
                    : success
                      ? 'border-green-500 bg-white text-gray-900 focus:ring-green-500/20 dark:bg-neutral-800 dark:text-white dark:focus:ring-green-500/30'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-primary-500/20 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-white dark:hover:border-neutral-600/70 dark:focus:ring-primary-500/30'
                } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                placeholder="#000000"
              />
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400">
                #
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg py-2 text-sm text-primary-600" role="alert">
            <TriangleAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && !error && (
          <div className="flex items-start gap-2 rounded-lg py-2 text-sm text-green-600" role="status">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}
