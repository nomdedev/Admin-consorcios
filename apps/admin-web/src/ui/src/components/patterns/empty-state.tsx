"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../primitives/button";

// =============================================================================
// EmptyState - Estado vacío con ilustración y CTA
// =============================================================================

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6 text-center",
          className
        )}
        ref={ref}
        {...props}
      >
        {icon && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
            {icon}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        
        {description && (
          <p className="mt-2 max-w-sm text-base text-neutral-600">{description}</p>
        )}
        
        {action && (
          <Button className="mt-6" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
