import { useState, useId } from 'react';
import { cn } from '@/lib/utils';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FloatingInput({ label, className, ...props }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const id = useId();
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className="relative group">
      <input
        id={id}
        {...props}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        className={cn(
          "w-full text-base py-2.5 px-1 bg-transparent border-b border-muted-foreground/30",
          "text-foreground outline-none transition-all duration-200",
          "peer",
          className
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "absolute left-1 text-muted-foreground pointer-events-none",
          "transition-all duration-200 ease-out",
          isFocused || hasValue
            ? "top-[-1.25rem] text-xs text-foreground font-medium"
            : "top-2.5 text-base"
        )}
      >
        {label}
      </label>
      <span
        className={cn(
          "absolute bottom-0 left-1/2 h-0.5 bg-foreground",
          "transition-all duration-200 ease-out",
          isFocused ? "w-full left-0" : "w-0"
        )}
      />
    </div>
  );
}
