"use client";

import * as React from "react";

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  showArrow?: boolean;
  disabled?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  contentClassName?: string;
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    const {
      children,
      content,
      showArrow = true,
      disabled = false,
      placement = "top",
      delay = 100,
      className = "",
      contentClassName = "",
      ...rest
    } = props;

    const [isVisible, setIsVisible] = React.useState(false);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const tooltipId = React.useRef(`tooltip-${Math.random().toString(36).substring(2, 11)}`);

    const showTooltip = React.useCallback(() => {
      if (disabled) return;

      timeoutRef.current = setTimeout(() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setPosition({
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
          });
        }
        setIsVisible(true);
      }, delay);
    }, [disabled, delay]);

    const hideTooltip = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }, []);

    // Handle Escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isVisible) {
          hideTooltip();
        }
      };

      if (isVisible) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [isVisible, hideTooltip]);

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
      if (!triggerRef.current || !tooltipRef.current) return {};

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      switch (placement) {
        case "top":
          return {
            left:
              triggerRect.left +
              scrollX +
              triggerRect.width / 2 -
              tooltipRect.width / 2,
            top: triggerRect.top + scrollY - tooltipRect.height - 8,
          };
        case "bottom":
          return {
            left:
              triggerRect.left +
              scrollX +
              triggerRect.width / 2 -
              tooltipRect.width / 2,
            top: triggerRect.top + scrollY + triggerRect.height + 8,
          };
        case "left":
          return {
            left: triggerRect.left + scrollX - tooltipRect.width - 8,
            top:
              triggerRect.top +
              scrollY +
              triggerRect.height / 2 -
              tooltipRect.height / 2,
          };
        case "right":
          return {
            left: triggerRect.left + scrollX + triggerRect.width + 8,
            top:
              triggerRect.top +
              scrollY +
              triggerRect.height / 2 -
              tooltipRect.height / 2,
          };
        default:
          return {};
      }
    };

    // Get arrow classes based on position
    const getArrowClasses = () => {
      const baseClasses =
        "absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45";

      switch (placement) {
        case "top":
          return `${baseClasses} bottom-[-4px] left-1/2 -translate-x-1/2`;
        case "bottom":
          return `${baseClasses} top-[-4px] left-1/2 -translate-x-1/2`;
        case "left":
          return `${baseClasses} right-[-4px] top-1/2 -translate-y-1/2`;
        case "right":
          return `${baseClasses} left-[-4px] top-1/2 -translate-y-1/2`;
        default:
          return "";
      }
    };

    // Placement classes for animation
    const getPlacementClasses = () => {
      switch (placement) {
        case "top":
          return "origin-bottom";
        case "bottom":
          return "origin-top";
        case "left":
          return "origin-right";
        case "right":
          return "origin-left";
        default:
          return "";
      }
    };

    if (disabled) {
      return <>{children}</>;
    }

    return (
      <div className={`relative inline-block ${className}`} {...rest}>
        <div
          ref={triggerRef}
          onMouseEnter={showTooltip}
          onMouseLeave={hideTooltip}
          onFocus={showTooltip}
          onBlur={hideTooltip}
          className="inline-flex"
          aria-describedby={isVisible ? tooltipId.current : undefined}
        >
          {children}
        </div>

        {isVisible && (
          <div
            ref={(node) => {
              if (node) {
                tooltipRef.current = node;
                if (typeof ref === "function") {
                  ref(node);
                } else if (ref) {
                  ref.current = node;
                }
              }
            }}
            id={tooltipId.current}
            role="tooltip"
            style={getTooltipStyle()}
            className={`fixed z-[9999] ${getPlacementClasses()} ${contentClassName}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            <div className="relative">
              <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-lg px-3 py-2 max-w-xs">
                {content}
              </div>
              {showArrow && <div className={getArrowClasses()} />}
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Simplified version for common use
interface SimpleTooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const SimpleTooltip = React.forwardRef<
  HTMLDivElement,
  SimpleTooltipProps
>(function SimpleTooltip(
  { children, text, position = "top", className = "" },
  ref
) {
  return (
    <Tooltip
      ref={ref}
      content={text}
      placement={position}
      className={className}
      contentClassName="bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg"
    >
      {children}
    </Tooltip>
  );
});

// Hook to create tooltips programmatically
export function useTooltip() {
  const [tooltips, setTooltips] = React.useState<
    Array<{
      id: string;
      content: React.ReactNode;
      position: { x: number; y: number };
      placement: TooltipProps["placement"];
    }>
  >([]);

  const showTooltip = React.useCallback(
    (
      content: React.ReactNode,
      element: HTMLElement,
      placement: TooltipProps["placement"] = "top"
    ) => {
      const rect = element.getBoundingClientRect();
      const id = Math.random().toString(36).substring(7);

      setTooltips((prev) => [
        ...prev,
        {
          id,
          content,
          position: {
            x: rect.left + window.scrollX,
            y: rect.top + window.scrollY,
          },
          placement,
        },
      ]);

      return id;
    },
    []
  );

  const hideTooltip = React.useCallback((id: string) => {
    setTooltips((prev) => prev.filter((tooltip) => tooltip.id !== id));
  }, []);

  const TooltipRenderer = React.useCallback(() => {
    return (
      <>
        {tooltips.map((tooltip) => (
          <div
            key={tooltip.id}
            className="fixed z-[9999] bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg px-3 py-2 max-w-xs"
            style={{
              left: tooltip.position.x,
              top: tooltip.position.y - 40,
            }}
          >
            {tooltip.content}
          </div>
        ))}
      </>
    );
  }, [tooltips]);

  return {
    showTooltip,
    hideTooltip,
    TooltipRenderer,
  };
}

// TooltipProvider component to manage tooltips globally
interface TooltipProviderProps {
  children: React.ReactNode;
  delay?: number;
  defaultPlacement?: TooltipProps["placement"];
}

export const TooltipProvider = ({
  children,
  delay = 100,
  defaultPlacement = "top",
}: TooltipProviderProps) => {
  const [globalTooltips, setGlobalTooltips] = React.useState<
    Array<{
      id: string;
      content: React.ReactNode;
      position: { x: number; y: number };
      placement: TooltipProps["placement"];
    }>
  >([]);

  const contextValue = React.useMemo(
    () => ({
      showTooltip: (
        content: React.ReactNode,
        element: HTMLElement,
        placement: TooltipProps["placement"] = defaultPlacement
      ) => {
        const rect = element.getBoundingClientRect();
        const id = Math.random().toString(36).substring(7);

        setGlobalTooltips((prev) => [
          ...prev,
          {
            id,
            content,
            position: {
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
            },
            placement,
          },
        ]);

        return id;
      },
      hideTooltip: (id: string) => {
        setGlobalTooltips((prev) =>
          prev.filter((tooltip) => tooltip.id !== id)
        );
      },
      hideAllTooltips: () => {
        setGlobalTooltips([]);
      },
    }),
    [defaultPlacement]
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      <GlobalTooltips tooltips={globalTooltips} />
    </TooltipContext.Provider>
  );
};

const TooltipContext = React.createContext<{
  showTooltip: (
    content: React.ReactNode,
    element: HTMLElement,
    placement?: TooltipProps["placement"]
  ) => string;
  hideTooltip: (id: string) => void;
  hideAllTooltips: () => void;
} | null>(null);

export const useGlobalTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("useGlobalTooltip must be used within TooltipProvider");
  }
  return context;
};

const GlobalTooltips = ({ tooltips }: { tooltips: Array<any> }) => {
  if (tooltips.length === 0) return null;

  return (
    <>
      {tooltips.map((tooltip) => (
        <div
          key={tooltip.id}
          className="fixed z-[9999] bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg px-3 py-2 max-w-xs animate-in fade-in"
          style={{
            left: tooltip.position.x,
            top: tooltip.position.y - 40,
          }}
        >
          {tooltip.content}
        </div>
      ))}
    </>
  );
};
