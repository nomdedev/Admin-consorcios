import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Avatar - Con iniciales fallback accesible
// =============================================================================

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  nombre?: string;
  apellido?: string;
  size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, nombre, apellido, size = "md", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-14 w-14 text-base",
    };

    const getInitials = () => {
      const n = nombre?.charAt(0).toUpperCase() || "";
      const a = apellido?.charAt(0).toUpperCase() || "";
      return n + a || "?";
    };

    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          "bg-brand-100 text-brand-700 font-semibold",
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {src && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={alt || `Avatar de ${nombre} ${apellido}`}
            className="h-full w-full object-cover"
            src={src}
            onError={() => setHasError(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials()}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
