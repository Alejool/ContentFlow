import {
  getCountryCallingCode,
  parsePhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, TriangleAlert } from 'lucide-react';
import Select from '@/Components/common/Modern/Select';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  success?: string | undefined;
  hint?: string | undefined;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  required?: boolean;
  countries?: CountryCode[];
  defaultCountry?: CountryCode;
  className?: string;
}

// Mapeo de nombres de países en español
const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  DO: 'República Dominicana',
  EC: 'Ecuador',
  SV: 'El Salvador',
  GT: 'Guatemala',
  HT: 'Haití',
  HN: 'Honduras',
  MX: 'México',
  NI: 'Nicaragua',
  PA: 'Panamá',
  PY: 'Paraguay',
  PE: 'Perú',
  PR: 'Puerto Rico',
  UY: 'Uruguay',
  VE: 'Venezuela',
  US: 'Estados Unidos',
  ES: 'España',
};

export default function PhoneInput({
  value = '',
  onChange,
  error,
  disabled = false,
  label,
  placeholder,
  required = false,
  countries = [
    'AR',
    'BO',
    'BR',
    'CL',
    'CO',
    'CR',
    'CU',
    'DO',
    'EC',
    'SV',
    'GT',
    'HT',
    'HN',
    'MX',
    'NI',
    'PA',
    'PY',
    'PE',
    'PR',
    'UY',
    'VE',
    'US',
    'ES',
  ],
  defaultCountry = 'CO',
  className = '',
}: PhoneInputProps) {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>(error);
  const [isValid, setIsValid] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const onChangeRef = useRef(onChange);
  const lastEmittedValue = useRef<string>('');

  // Mantener la referencia actualizada de onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Parsear el valor inicial solo una vez
  useEffect(() => {
    if (value && !isInitialized) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber && phoneNumber.country) {
          setSelectedCountry(phoneNumber.country as CountryCode);
          setNationalNumber(phoneNumber.nationalNumber);
        }
      } catch {
        // Si no se puede parsear, intentar extraer el número
        const cleaned = value.replace(/^\+\d+\s*/, '');
        if (cleaned) {
          setNationalNumber(cleaned);
        }
      }
      setIsInitialized(true);
    } else if (!value && !isInitialized) {
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  // Validar y actualizar el valor completo cuando cambia el país o número
  useEffect(() => {
    if (!isInitialized) return;

    if (nationalNumber && nationalNumber.length > 0) {
      try {
        const callingCode = getCountryCallingCode(selectedCountry);
        const fullNumber = `+${callingCode}${nationalNumber}`;

        // Solo emitir si el valor cambió
        if (fullNumber === lastEmittedValue.current) return;

        // Validar
        if (isPossiblePhoneNumber(fullNumber)) {
          if (isValidPhoneNumber(fullNumber)) {
            setValidationError(undefined);
            setIsValid(true);
            lastEmittedValue.current = fullNumber;
            onChangeRef.current(fullNumber);
          } else {
            setValidationError(t('validation.phoneNotValid'));
            setIsValid(false);
            lastEmittedValue.current = fullNumber;
            onChangeRef.current(fullNumber);
          }
        } else {
          setValidationError(t('validation.phoneInvalid'));
          setIsValid(false);
          lastEmittedValue.current = fullNumber;
          onChangeRef.current(fullNumber);
        }
      } catch (err) {
        console.error('Error validating phone:', err);
        setValidationError(t('validation.phoneInvalid'));
        setIsValid(false);
      }
    } else {
      // Solo emitir si el valor cambió
      if ('' === lastEmittedValue.current) return;

      setValidationError(undefined);
      setIsValid(false);
      lastEmittedValue.current = '';
      onChangeRef.current('');
    }
  }, [selectedCountry, nationalNumber, isInitialized, t]);

  // Opciones para el Select con banderas (memoizado para evitar re-renders)
  const countryOptions = useMemo(() => {
    return countries.map((country) => {
      try {
        const callingCode = getCountryCallingCode(country);
        const flag = String.fromCodePoint(
          ...country
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0)),
        );
        return {
          value: country,
          label: `${flag} ${COUNTRY_NAMES[country] || country} (+${callingCode})`,
          icon: <span className="text-xl leading-none">{flag}</span>,
        };
      } catch {
        const flag = String.fromCodePoint(
          ...country
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0)),
        );
        return {
          value: country,
          label: `${flag} ${COUNTRY_NAMES[country] || country}`,
          icon: <span className="text-xl leading-none">{flag}</span>,
        };
      }
    });
  }, [countries]);

  const handleCountryChange = (value: string | number | string[]) => {
    if (typeof value === 'string') {
      setSelectedCountry(value as CountryCode);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números
    const cleaned = e.target.value.replace(/\D/g, '');
    setNationalNumber(cleaned);
  };

  let callingCode = '';
  try {
    callingCode = getCountryCallingCode(selectedCountry);
  } catch {
    callingCode = '1';
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
          {!required && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Opcional)</span>
          )}
        </label>
      )}

      <div className="grid grid-cols-12 gap-3">
        {/* Selector de país */}
        <div className="col-span-5">
          <Select
            id="country-select"
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            disabled={disabled}
            searchable
            variant="filled"
            size="lg"
            placeholder="País"
          />
        </div>

        {/* Input de número */}
        <div className="col-span-7">
          <div className="relative">
            <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-base font-medium text-gray-500 dark:text-gray-400">
              +{callingCode}
            </div>
            <input
              type="tel"
              value={nationalNumber}
              onChange={handleNumberChange}
              disabled={disabled}
              placeholder={placeholder || t('profile.information.phonePlaceholder')}
              className={`w-full rounded-lg border bg-gray-50 py-3 pr-4 text-base text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-neutral-800/50 dark:text-white ${validationError ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-primary-400 focus:border-primary-500 focus:ring-primary-500/20 dark:border-neutral-700 dark:hover:border-primary-600'} ${disabled ? 'cursor-not-allowed opacity-60' : ''} `}
              style={{ paddingLeft: `${2.5 + callingCode.length * 0.6}rem` }}
            />
          </div>
        </div>
      </div>

      {/* Mensajes de validación */}
      {validationError && (
        <div className="animate-shake mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <TriangleAlert className="h-4 w-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {isValid && !validationError && nationalNumber && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            {(() => {
              try {
                const phoneNumber = parsePhoneNumber(`+${callingCode}${nationalNumber}`);
                if (phoneNumber) {
                  return `${phoneNumber.formatInternational()} - ${phoneNumber.country}`;
                }
                return t('validation.phoneValid');
              } catch {
                return t('validation.phoneValid');
              }
            })()}
          </span>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
