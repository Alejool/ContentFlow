/**
 * Focus Visible Manager
 * 
 * Manages focus-visible behavior for keyboard navigation
 * Ensures focus indicators only show for keyboard users
 */

import { useEffect } from 'react';

let hadKeyboardEvent = false;
let hadFocusVisibleRecently = false;
let hadFocusVisibleRecentlyTimeout: NodeJS.Timeout | null = null;

const inputTypesAllowlist = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
  'date',
  'month',
  'week',
  'time',
  'datetime',
  'datetime-local',
]);

/**
 * Check if element should always show focus
 */
function focusTriggersKeyboardModality(element: Element): boolean {
  const { tagName, type, readOnly, isContentEditable } = element as HTMLInputElement;

  if (tagName === 'INPUT' && inputTypesAllowlist.has(type) && !readOnly) {
    return true;
  }

  if (tagName === 'TEXTAREA' && !readOnly) {
    return true;
  }

  if (isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Initialize focus-visible polyfill behavior
 */
export function useFocusVisible(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Meta' || e.key === 'Alt' || e.key === 'Control') {
        hadKeyboardEvent = true;
      }
    }

    function onPointerDown() {
      hadKeyboardEvent = false;
    }

    function onFocus(e: FocusEvent) {
      const target = e.target as Element;

      if (hadKeyboardEvent || focusTriggersKeyboardModality(target)) {
        target.classList.add('focus-visible');
        target.setAttribute('data-focus-visible-added', '');
      }
    }

    function onBlur(e: FocusEvent) {
      const target = e.target as Element;

      if (target.classList.contains('focus-visible')) {
        hadFocusVisibleRecently = true;
        
        if (hadFocusVisibleRecentlyTimeout) {
          clearTimeout(hadFocusVisibleRecentlyTimeout);
        }

        hadFocusVisibleRecentlyTimeout = setTimeout(() => {
          hadFocusVisibleRecently = false;
        }, 100);

        target.classList.remove('focus-visible');
        target.removeAttribute('data-focus-visible-added');
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      document.removeEventListener('focus', onFocus, true);
      document.removeEventListener('blur', onBlur, true);
    };
  }, []);
}
