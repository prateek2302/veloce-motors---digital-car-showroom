import { useState } from 'react';
import { CarFront } from 'lucide-react';

interface VehicleImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function VehicleImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: VehicleImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#ECEAE4] via-[#E2DFD7] to-[#D6D2C8] text-[#141517]/60 ${className}`}
        role="img"
        aria-label={alt}
      >
        <CarFront className="h-10 w-10 mb-2 opacity-60" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
