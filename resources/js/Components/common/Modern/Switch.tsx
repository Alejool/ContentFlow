import { prefersReducedMotion } from '@/Utils/themeTransition';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';

interface SwitchProps {
  id?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onChange?: (checked: boolean) => void;
  isDisabled?: boolean;
  className?: string;
  containerClassName?: string;
  showIcon?: boolean;
  icon?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'minimal' | 'animated';
  name?: string;
  value?: string;
  labelPosition?: 'left' | 'right';
}

export default function Switch({
  id,
  label,
  description,
  checked,
  isSelected,
  defaultSelected,
  onChange,
  isDisabled = false,
  className = '',
  containerClassName = '',
  showIcon = false,
  icon,
  size = 'md',
  variant = 'default',
  name,
  value,
  labelPosition = 'left',
}: SwitchProps) {
  const selected = isSelected ?? checked ?? undefined;
  const reducedMotion = prefersReducedMotion();

  // Tamaños del switch (track y thumb)
  const sizeClasses = {
    xs: {
      track: 'h-4 w-8',
      thumb: 'h-3 w-3',
      translate: 'translate-x-4',
      padding: 'left-0.5 top-0.5',
    },
    sm: {
      track: 'h-5 w-10',
      thumb: 'h-4 w-4',
      translate: 'translate-x-5',
      padding: 'left-0.5 top-0.5',
    },
    md: {
      track: 'h-6 w-12',
      thumb: 'h-4 w-4',
      translate: 'translate-x-6',
      padding: 'left-1 top-1',
    },
    lg: {
      track: 'h-7 w-14',
      thumb: 'h-5 w-5',
      translate: 'translate-x-7',
      padding: 'left-1 top-1',
    },
    xl: {
      track: 'h-8 w-16',
      thumb: 'h-6 w-6',
      translate: 'translate-x-8',
      padding: 'left-1 top-1',
    },
  };

  // Tamaños del icono decorativo
  const iconSizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-14 w-14',
  };

  // Tamaños del icono dentro del contenedor
  const iconInnerSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-7 w-7',
  };

  // Tamaños de texto
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const descriptionSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const sizes = sizeClasses[size];

  const spring = {
    type: 'spring' as const,
    stiffness: 700,
    damping: 30,
  };

  const renderSwitch = (isSelected: boolean) => {
    if (variant === 'animated') {
      return (
        <div className="relative inline-flex items-center">
          <div
            className={`relative inline-flex ${sizes.track} cursor-pointer items-center rounded-full transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-primary-500 group-focus-visible:ring-offset-2 ${
              isSelected ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <LazyMotion features={domAnimation}>
              <m.span
                className={`inline-block ${sizes.thumb} rounded-full bg-white shadow-sm`}
                initial={false}
                animate={{
                  x: isSelected ? parseInt(sizes.translate.replace(/\D/g, '')) * 4 : 2,
                }}
                transition={reducedMotion ? { duration: 0 } : spring}
              />
            </LazyMotion>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <div
          className={`block ${sizes.track} rounded-full transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-primary-500 group-focus-visible:ring-offset-2 ${
            isSelected ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <div
            className={`absolute ${sizes.padding} ${sizes.thumb} rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isSelected ? sizes.translate : ''
            }`}
          />
        </div>
      </div>
    );
  };

  const renderLabel = () => {
    if (!label && !description) return null;

    return (
      <div className={`flex items-center gap-3 ${variant === 'minimal' ? 'gap-2' : ''}`}>
        {showIcon && !variant.includes('minimal') && (
          <div
            className={`flex ${iconSizeClasses[size]} items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20`}
          >
            {icon || (
              <svg
                className={`${iconInnerSizeClasses[size]} text-primary-500`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}
        <div>
          {label && (
            <span
              className={`block font-medium text-gray-900 dark:text-white ${textSizeClasses[size]}`}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className={`block text-gray-500 dark:text-gray-400 ${descriptionSizeClasses[size]}`}
            >
              {description}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AriaSwitch
      id={id}
      isSelected={selected}
      defaultSelected={defaultSelected}
      onChange={onChange}
      isDisabled={isDisabled}
      name={name}
      value={value}
      className={`group flex cursor-pointer items-center ${labelPosition === 'left' ? 'justify-between' : 'justify-start gap-3'} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''} ${containerClassName}`}
    >
      {({ isSelected }: { isSelected: boolean }) => (
        <>
          {labelPosition === 'left' && renderLabel()}
          {renderSwitch(isSelected)}
          {labelPosition === 'right' && renderLabel()}
        </>
      )}
    </AriaSwitch>
  );
}
