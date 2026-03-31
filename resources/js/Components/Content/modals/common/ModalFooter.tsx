import Button from '@/Components/common/Modern/Button';
import { Save, X } from 'lucide-react';
import React from 'react';

interface ModalFooterProps {
  isSubmitting?: boolean;
  onClose?: () => void;
  submitText?: string;
  cancelText?: string;
  formId?: string;
  submitIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  showSecondarySubmit?: boolean;
  secondarySubmitText?: string;
  secondarySubmitVariant?: ModalFooterProps['submitVariant'];
  secondarySubmitStyle?: ModalFooterProps['submitStyle'];
  secondarySubmitIcon?: React.ReactNode;
  onSecondarySubmit?: () => void;
  onPrimarySubmit?: () => void;

  submitVariant?: 'primary' | 'danger' | 'secondary' | 'success' | 'ghost' | 'warning';
  cancelVariant?: 'primary' | 'danger' | 'secondary' | 'success' | 'ghost' | 'warning';
  submitStyle?: 'solid' | 'outline' | 'gradient' | 'ghost';
  cancelStyle?: 'solid' | 'outline' | 'gradient' | 'ghost';
  hideSubmit?: boolean;
  disableSubmit?: boolean;
  style?: React.CSSProperties;
  activeColor?: string;
  children?: React.ReactNode;
}

export default function ModalFooter({
  isSubmitting = false,
  onClose,
  submitText = 'Save',
  cancelText = 'Cancel',
  formId,
  submitIcon = <Save className="h-4 w-4" />,
  cancelIcon = <X className="h-4 w-4" />,
  showSecondarySubmit = false,
  secondarySubmitText = 'Secondary',
  secondarySubmitVariant = 'secondary',
  secondarySubmitStyle = 'outline',
  secondarySubmitIcon,

  onSecondarySubmit,
  onPrimarySubmit,
  submitVariant = 'primary',
  cancelVariant = 'secondary',
  submitStyle = 'gradient',
  cancelStyle = 'outline',
  hideSubmit = false,
  disableSubmit = false,
  style,
  activeColor,
  children,
}: ModalFooterProps) {
  return (
    <div
      className="sticky bottom-0 z-20 flex items-center justify-between gap-4 border-t border-gray-100 bg-opacity-95 bg-gradient-to-r from-gray-50 to-white p-4 backdrop-blur-sm dark:border-neutral-700 dark:bg-opacity-95 dark:from-neutral-900 dark:to-neutral-800"
      style={style}
    >
      <div className="flex flex-1 flex-col gap-4 overflow-x-auto">
        <div className="min-w-0 flex-1 overflow-x-auto">{children}</div>

        <div className="flex shrink-0 justify-end gap-3">
          {onClose && (
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              variant={cancelVariant}
              buttonStyle={cancelStyle}
              size="md"
              icon={cancelIcon}
              style={{
                ...(activeColor
                  ? {
                      borderColor: `${activeColor}40`,
                      color: activeColor,
                    }
                  : {}),
              }}
            >
              {cancelText}
            </Button>
          )}

          {showSecondarySubmit && (
            <Button
              type={onSecondarySubmit ? 'button' : 'submit'}
              form={onSecondarySubmit ? undefined : formId}
              onClick={onSecondarySubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              variant={secondarySubmitVariant || 'secondary'}
              buttonStyle={secondarySubmitStyle || 'outline'}
              size="md"
              icon={secondarySubmitIcon}
            >
              {secondarySubmitText}
            </Button>
          )}

          {!hideSubmit && (
            <Button
              type={onPrimarySubmit ? 'button' : formId ? 'submit' : 'button'}
              form={onPrimarySubmit ? undefined : formId}
              onClick={(e) => {
                console.log('=== Submit button clicked ===');
                console.log('onPrimarySubmit:', !!onPrimarySubmit);
                console.log('formId:', formId);
                console.log(
                  'Button type:',
                  onPrimarySubmit ? 'button' : formId ? 'submit' : 'button',
                );
                console.log('Button form:', onPrimarySubmit ? undefined : formId);
                if (onPrimarySubmit) {
                  onPrimarySubmit();
                }
              }}
              disabled={isSubmitting || disableSubmit}
              loading={isSubmitting}
              variant={submitVariant}
              buttonStyle={submitStyle}
              size="md"
              icon={submitIcon}
              style={{
                ...(activeColor && submitVariant === 'primary'
                  ? {
                      backgroundColor: activeColor,
                      borderColor: activeColor,
                      backgroundImage: 'none',
                    }
                  : {}),
              }}
            >
              {submitText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
