import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, leftIcon, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
              leftIcon ? "pl-10" : ""
            } ${
              error
                ? "border-red-300 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                : "border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
