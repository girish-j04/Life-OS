import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-neutral-50 dark:ring-offset-dark-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary-orange text-white hover:bg-primary-orange/90',
        destructive: 'bg-primary-red text-white hover:bg-primary-red/90',
        outline:
          'border-2 border-neutral-900 dark:border-dark-border bg-transparent hover:bg-neutral-100 dark:hover:bg-dark-surface2',
        secondary: 'bg-neutral-200 dark:bg-dark-surface text-neutral-900 dark:text-dark-text hover:bg-neutral-300 dark:hover:bg-dark-surface2',
        ghost: 'hover:bg-neutral-100 dark:hover:bg-dark-surface',
        link: 'text-primary-orange underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
