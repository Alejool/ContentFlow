import { useTheme } from "@/Hooks/useTheme";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface CountryCode {
  code: string;
  prefix: string;
  flag: string;
  name: string;
}

export const COUNTRIES: CountryCode[] = [
  { code: "CO", prefix: "+57", flag: "🇨🇴", name: "Colombia" },
  { code: "US", prefix: "+1", flag: "🇺🇸", name: "United States" },
  { code: "MX", prefix: "+52", flag: "🇲🇽", name: "México" },
  { code: "ES", prefix: "+34", flag: "🇪🇸", name: "España" },
  { code: "AR", prefix: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "CL", prefix: "+56", flag: "🇨🇱", name: "Chile" },
  { code: "PE", prefix: "+51", flag: "🇵🇪", name: "Perú" },
  { code: "EC", prefix: "+593", flag: "🇪🇨", name: "Ecuador" },
  { code: "VE", prefix: "+58", flag: "🇻🇪", name: "Venezuela" },
  { code: "BR", prefix: "+55", flag: "🇧🇷", name: "Brasil" },
];

interface CountryCodeSelectorProps {
  value?: string;
  onChange: (prefix: string) => void;
  disabled?: boolean;
}

export default function CountryCodeSelector({
  value,
  onChange,
  disabled = false,
}: CountryCodeSelectorProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.prefix === value) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (containerRef.current) {
        setRect(containerRef.current.getBoundingClientRect());
      }
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (prefix: string) => {
    onChange(prefix);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 border ${
          theme === "dark"
            ? "hover:bg-neutral-700/50 text-gray-300 border-neutral-700/50 bg-neutral-800/20"
            : "hover:bg-gray-100/80 text-gray-700 border-gray-200 bg-gray-50/50"
        } ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } min-w-[70px] justify-center`}
      >
        <span className="text-xl leading-none">{selectedCountry.flag}</span>
        <span className="text-sm font-semibold tracking-tight">
          {selectedCountry.prefix}
        </span>
      </button>

      {isOpen &&
        rect &&
        createPortal(
          <div
            className={`fixed z-[9999] mt-1 overflow-hidden rounded-lg shadow-xl border ${
              theme === "dark"
                ? "bg-neutral-800 border-neutral-700"
                : "bg-white border-gray-200"
            }`}
            style={{
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              minWidth: "160px",
            }}
          >
            <div className="max-height-[240px] overflow-y-auto py-1">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.prefix)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    theme === "dark"
                      ? "text-gray-300 hover:bg-neutral-700"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${
                    value === country.prefix
                      ? theme === "dark"
                        ? "bg-purple-600/20 text-purple-400"
                        : "bg-purple-50 text-purple-600"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </div>
                  <span className="font-medium opacity-60">
                    {country.prefix}
                  </span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
