import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Card - Componente Contenedor
// =============================================================================

const cardVariants = cva(
  "rounded-card bg-white transition-shadow duration-200",
  {
    variants: {
      variant: {
        default: "shadow-card",
        elevated: "shadow-card-hover",
        outlined: "border border-neutral-200 shadow-none",
        ghost: "shadow-none bg-transparent",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hoverable: {
        true: "cursor-pointer hover:shadow-card-hover",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hoverable, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, padding, hoverable, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

// -----------------------------------------------------------------------------
// Card Header
// -----------------------------------------------------------------------------

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("flex flex-col space-y-1.5", className)}
    ref={ref}
    {...props}
  />
));

CardHeader.displayName = "CardHeader";

// -----------------------------------------------------------------------------
// Card Title
// -----------------------------------------------------------------------------

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    className={cn("text-xl font-semibold text-neutral-900", className)}
    ref={ref}
    {...props}
  >
    {children || <span className="sr-only">Título de tarjeta</span>}
  </h3>
));

CardTitle.displayName = "CardTitle";

// -----------------------------------------------------------------------------
// Card Description
// -----------------------------------------------------------------------------

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    className={cn("text-base text-neutral-600", className)}
    ref={ref}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

// -----------------------------------------------------------------------------
// Card Content
// -----------------------------------------------------------------------------

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("pt-4", className)} ref={ref} {...props} />
));

CardContent.displayName = "CardContent";

// -----------------------------------------------------------------------------
// Card Footer
// -----------------------------------------------------------------------------

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("flex items-center pt-4", className)}
    ref={ref}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};
