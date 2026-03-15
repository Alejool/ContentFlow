import { useEffect, useRef, useState } from "react";

interface WorkspaceLogoProps {
  src: string;
  alt: string;
  /** Fallback initial shown if image fails or times out */
  fallback?: string;
  timeoutMs?: number;
}

export function WorkspaceLogo({ src, alt, fallback, timeoutMs = 5000 }: WorkspaceLogoProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initial = (fallback ?? alt).charAt(0).toUpperCase();

  useEffect(() => {
    // Reset on src change
    setStatus("loading");

    const img = new Image();

    timerRef.current = setTimeout(() => {
      setStatus("error");
    }, timeoutMs);

    img.onload = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("loaded");
    };

    img.onerror = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("error");
    };

    img.src = src;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [src, timeoutMs]);

  if (status === "error") {
    return (
      <span className="absolute inset-0 flex items-center justify-center font-bold text-inherit">
        {initial}
      </span>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 overflow-hidden bg-gray-200 dark:bg-neutral-700">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
