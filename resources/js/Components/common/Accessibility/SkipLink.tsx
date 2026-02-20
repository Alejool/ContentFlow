/**
 * Skip Link Component
 * 
 * Provides keyboard users a way to skip to main content
 * WCAG 2.4.1 - Bypass Blocks (Level A)
 */

import React from 'react';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  href = '#main-content',
  children = 'Saltar al contenido principal'
}) => {
  return (
    <a
      href={href}
      className="skip-link focus-ring"
      onClick={(e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          (target as HTMLElement).focus();
          (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {children}
    </a>
  );
};
