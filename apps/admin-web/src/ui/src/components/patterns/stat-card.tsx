"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// StatCard - Tarjeta de estadística para dashboards
// =============================================================================

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
  };
  loading?: boolean;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      title,
      value,
      description,
      icon,
      trend,
      loading = false,
      ...props
    },
    ref
  ) => {
    const getTrendColor = () => {
      if (!trend) return "";
      switch (trend.direction) {
        case "up":
          return "text-status-alDia";
        case "down":
          return "text-status-grave";
        default:
          return "text-neutral-500";
      }
    };

    const getTrendIcon = () => {
      if (!trend) return null;
      switch (trend.direction) {
        case "up":
          return "↑";
        case "down":
          return "↓";
        default:
          return "→";
      }
    };

    return (
      <div
        className={cn(
          "rounded-card border border-neutral-200 bg-white p-6",
          "shadow-sm transition-shadow hover:shadow-md",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded bg-neutral-200" />
            ) : (
              <p className="text-3xl font-bold text-neutral-900">{value}</p>
            )}
            
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
            
            {trend && (
              <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                <span aria-hidden="true">{getTrendIcon()}</span>
                <span>{trend.value}%</span>
                {trend.label && (
                  <span className="text-neutral-500">{trend.label}</span>
                )}
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";
