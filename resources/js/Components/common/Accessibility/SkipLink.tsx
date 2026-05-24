/**
 * Skip Link Component
 *
 * Provides keyboard users a way to skip to main content
 * WCAG 2.4.1 - Bypass Blocks (Level A)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href = '#main-content',
  children,
}) => {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      className="focus-ring skip-link"
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {children || t('common.skipToMainContent', 'Saltar al contenido principal')}
    </a>
  );
};
