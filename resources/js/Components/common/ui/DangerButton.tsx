import { ButtonHTMLAttributes, ReactNode } from "react";

interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
}

export default function DangerButton({
  className = "",
  disabled,
  children,
  ...props
}: DangerButtonProps) {
  return (
    <button
      {...props}
      className={
        `inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:bg-primary-700 ${
          disabled && "opacity-25"
        } ` + className
      }
      disabled={disabled}
    >
      {children}
    </button>
  );
}
