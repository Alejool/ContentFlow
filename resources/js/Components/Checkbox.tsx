import { InputHTMLAttributes } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      className={
        "rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500 " +
        className
      }
    />
  );
}
