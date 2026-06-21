"use client";

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// AlertBanner - Banner de alerta/notificación prominente
// =============================================================================

export interface AlertBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const variantConfig = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: Info,
    iconColor: "text-blue-600",
    titleColor: "text-blue-900",
    textColor: "text-blue-800",
  },
  success: {
    bg: "bg-green-50 border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-600",
    titleColor: "text-green-900",
    textColor: "text-green-800",
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-200",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    titleColor: "text-yellow-900",
    textColor: "text-yellow-800",
  },
  error: {
    bg: "bg-red-50 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-600",
    titleColor: "text-red-900",
    textColor: "text-red-800",
  },
};

export const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    {
      className,
      variant = "info",
      title,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
      <div
        className={cn(
          "relative flex gap-3 rounded-card border p-4",
          config.bg,
          className
        )}
        ref={ref}
        role="alert"
        {...props}
      >
        <Icon
          aria-hidden="true"
          className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)}
        />

        <div className="flex-1">
          {title && (
            <h3 className={cn("font-semibold text-base mb-1", config.titleColor)}>
              {title}
            </h3>
          )}
          <div className={cn("text-base", config.textColor)}>{children}</div>
        </div>

        {dismissible && (
          <button
            aria-label="Cerrar alerta"
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 transition-opacity",
              "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2",
              "min-h-touch min-w-touch flex items-center justify-center",
              config.iconColor
            )}
            type="button"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

AlertBanner.displayName = "AlertBanner";
