import React from "react";
import { useTheme } from "@/Hooks/useTheme";

/**
 * SkipLink component - Provides a skip to main content link for keyboard users
 *
 * This component is positioned at the top of the page and is only visible when focused,
 * allowing keyboard users to bypass repetitive navigation elements and jump directly
 * to the main content.
 *
 * Requirements: 5.4
 *
 * @example
 * // In your layout component
 * <SkipLink />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */

interface SkipLinkProps {
  /**
   * The ID of the main content element to skip to
   * @default "main-content"
   */
  targetId?: string;

  /**
   * The text to display in the skip link
   * @default "Skip to main content"
   */
  text?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = "main-content",
  text = "Skip to main content",
}) => {
  const { actualTheme } = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById(targetId);
    if (target) {
      // Set focus to the target element
      target.focus();

      // If the element is not naturally focusable, set tabindex
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }

      // Scroll to the target
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`/* Hidden by default, on focus */ /* Focus styles with high contrast */ visible fixed left-0 top-0 z-[9999] m-2 -translate-y-full rounded-md px-4 py-2 font-medium opacity-0 transition-all duration-200 skip-link focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        actualTheme === "dark"
          ? "bg-orange-500 text-white focus:ring-orange-400 focus:ring-offset-neutral-900"
          : "bg-orange-600 text-white focus:ring-orange-500 focus:ring-offset-white"
      } `}
      style={{
        // Ensure the skip link is always on top
        zIndex: 9999,
      }}
    >
      {text}
    </a>
  );
};

export default SkipLink;
