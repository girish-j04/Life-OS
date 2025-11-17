import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border-2 border-neutral-900 dark:border-dark-border bg-white dark:bg-dark-surface px-3 py-2 text-sm text-neutral-900 dark:text-dark-text ring-offset-neutral-50 dark:ring-offset-dark-bg file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-900 dark:file:text-dark-text placeholder:text-neutral-400 dark:placeholder:text-dark-subtext focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
