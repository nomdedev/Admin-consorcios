// =============================================================================
// VecinoSimple - Design System Export
// =============================================================================

// -----------------------------------------------------------------------------
// Primitivos (Componentes base accesibles - Radix UI)
// -----------------------------------------------------------------------------
export * from "./components/primitives/button";
export * from "./components/primitives/input";
export * from "./components/primitives/textarea";
export * from "./components/primitives/card";
export * from "./components/primitives/label";
export * from "./components/primitives/dialog";
export * from "./components/primitives/toast";
export * from "./components/primitives/toaster";
export * from "./components/primitives/select";
export * from "./components/primitives/badge";
export * from "./components/primitives/spinner";
export * from "./components/primitives/avatar";

// -----------------------------------------------------------------------------
// Patterns (Componentes específicos del dominio VecinoSimple)
// -----------------------------------------------------------------------------
export * from "./components/patterns/expensa-card";
export * from "./components/patterns/paquete-card";
export * from "./components/patterns/alert-banner";
export * from "./components/patterns/stat-card";
export * from "./components/patterns/empty-state";
export * from "./components/patterns/moroso-indicator";

// -----------------------------------------------------------------------------
// Layouts (Estructuras de página)
// -----------------------------------------------------------------------------
export * from "./components/layouts/dashboard-layout";
export * from "./components/layouts/simple-layout";

// -----------------------------------------------------------------------------
// Providers
// -----------------------------------------------------------------------------
export * from "./components/providers/theme-provider";

// -----------------------------------------------------------------------------
// Stores
// -----------------------------------------------------------------------------
export * from "./stores/ui.store";

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------
export * from "./hooks/use-toast";

// -----------------------------------------------------------------------------
// Utilidades
// -----------------------------------------------------------------------------
export { cn } from "./lib/utils";
