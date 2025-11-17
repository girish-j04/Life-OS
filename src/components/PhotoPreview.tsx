import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoPreviewProps {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
  label?: string;
}

export function PhotoPreview({
  src,
  alt,
  className,
  thumbnailClassName,
  label,
}: PhotoPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'group relative overflow-hidden rounded-2xl border-2 border-neutral-200 dark:border-dark-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface transition-transform hover:-translate-y-0.5',
            className
          )}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={cn('h-16 w-16 object-cover', thumbnailClassName)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-5 w-5" />
          </div>
          {label && (
            <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {label}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-0 bg-transparent shadow-none">
        <img
          src={src}
          alt={alt}
          className="max-h-[75vh] w-full rounded-3xl object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
