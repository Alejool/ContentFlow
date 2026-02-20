import { describe, it, expect } from 'vitest';
import {
  hoverVariants,
  focusVariants,
  actionVariants,
  pageVariants,
  getVariant,
  getTransition,
  animationVariants,
} from '@/config/animationVariants';

describe('animationVariants', () => {
  describe('hoverVariants', () => {
    it('should have all required hover variants', () => {
      expect(hoverVariants).toHaveProperty('subtle');
      expect(hoverVariants).toHaveProperty('lift');
      expect(hoverVariants).toHaveProperty('scale');
      expect(hoverVariants).toHaveProperty('glow');
    });

    it('should have reduced motion alternatives for hover variants', () => {
      expect(hoverVariants.subtle).toHaveProperty('hoverReduced');
      expect(hoverVariants.lift).toHaveProperty('hoverReduced');
      expect(hoverVariants.scale).toHaveProperty('hoverReduced');
      expect(hoverVariants.glow).toHaveProperty('hoverReduced');
    });
  });

  describe('focusVariants', () => {
    it('should have all required focus variants', () => {
      expect(focusVariants).toHaveProperty('ring');
      expect(focusVariants).toHaveProperty('scaleFocus');
      expect(focusVariants).toHaveProperty('highlight');
    });

    it('should have reduced motion alternatives for focus variants', () => {
      expect(focusVariants.ring).toHaveProperty('focusReduced');
      expect(focusVariants.scaleFocus).toHaveProperty('focusReduced');
      expect(focusVariants.highlight).toHaveProperty('focusReduced');
    });
  });

  describe('actionVariants', () => {
    it('should have all required action variants', () => {
      expect(actionVariants).toHaveProperty('press');
      expect(actionVariants).toHaveProperty('success');
      expect(actionVariants).toHaveProperty('error');
      expect(actionVariants).toHaveProperty('loading');
    });

    it('should have reduced motion alternatives for action variants', () => {
      expect(actionVariants.press).toHaveProperty('tapReduced');
      expect(actionVariants.success).toHaveProperty('animateReduced');
      expect(actionVariants.error).toHaveProperty('animateReduced');
      expect(actionVariants.loading).toHaveProperty('animateReduced');
    });
  });

  describe('pageVariants', () => {
    it('should have all required page transition variants', () => {
      expect(pageVariants).toHaveProperty('fadeIn');
      expect(pageVariants).toHaveProperty('slideIn');
      expect(pageVariants).toHaveProperty('scaleIn');
    });

    it('should have reduced motion alternatives for page variants', () => {
      expect(pageVariants.fadeIn).toHaveProperty('animateReduced');
      expect(pageVariants.fadeIn).toHaveProperty('exitReduced');
      expect(pageVariants.slideIn).toHaveProperty('animateReduced');
      expect(pageVariants.slideIn).toHaveProperty('exitReduced');
      expect(pageVariants.scaleIn).toHaveProperty('animateReduced');
      expect(pageVariants.scaleIn).toHaveProperty('exitReduced');
    });
  });

  describe('getVariant', () => {
    it('should return normal variant when reduced motion is false', () => {
      const variant = getVariant(hoverVariants.subtle, 'hover', false);
      expect(variant).toEqual(hoverVariants.subtle.hover);
    });

    it('should return reduced variant when reduced motion is true', () => {
      const variant = getVariant(hoverVariants.subtle, 'hover', true);
      expect(variant).toEqual(hoverVariants.subtle.hoverReduced);
    });

    it('should return normal variant when reduced variant does not exist', () => {
      const variant = getVariant(hoverVariants.subtle, 'initial', true);
      expect(variant).toEqual(hoverVariants.subtle.initial);
    });
  });

  describe('getTransition', () => {
    it('should return instant transition when reduced motion is true', () => {
      const transition = getTransition({ duration: 0.3 }, true);
      expect(transition).toHaveProperty('duration', 0);
    });

    it('should return original transition when reduced motion is false', () => {
      const originalTransition = { duration: 0.3, ease: 'easeInOut' };
      const transition = getTransition(originalTransition, false);
      expect(transition).toEqual(originalTransition);
    });
  });

  describe('animationVariants export', () => {
    it('should export all variant categories', () => {
      expect(animationVariants).toHaveProperty('hover');
      expect(animationVariants).toHaveProperty('focus');
      expect(animationVariants).toHaveProperty('action');
      expect(animationVariants).toHaveProperty('page');
    });

    it('should have correct references to variant objects', () => {
      expect(animationVariants.hover).toBe(hoverVariants);
      expect(animationVariants.focus).toBe(focusVariants);
      expect(animationVariants.action).toBe(actionVariants);
      expect(animationVariants.page).toBe(pageVariants);
    });
  });
});
