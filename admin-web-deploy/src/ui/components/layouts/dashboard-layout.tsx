"use client";

import * as React from "react";
import { Menu, X, ChevronDown, LogOut, Bell } from "lucide-react";

import { cn } from "../../lib/utils";
import { Avatar } from "../primitives/avatar";

// =============================================================================
// DashboardLayout - Layout principal para todas las apps
// =============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  children?: NavItem[];
}

export interface UserData {
  nombre: string;
  apellido: string;
  email: string;
  avatarUrl?: string;
  rol?: string;
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  user?: UserData;
  logo?: React.ReactNode;
  title?: string;
  onNavigate?: (href: string) => void;
  onLogout?: () => void;
  notifications?: number;
  onNotificationsClick?: () => void;
  footer?: React.ReactNode;
}

// Navegación móvil (bottom navigation)
const MobileNav: React.FC<{
  items: NavItem[];
  onNavigate?: (href: string) => void;
}> = ({ items, onNavigate }) => {
  // Mostrar máximo 4 items en la barra inferior
  const visibleItems = items.slice(0, 4);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white md:hidden"
      role="navigation"
      aria-label="Navegación principal"
    >
      <ul className="flex justify-around">
        {visibleItems.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => onNavigate?.(item.href)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-3 text-xs",
                "min-h-touch min-w-touch transition-colors",
                item.active
                  ? "text-brand-600"
                  : "text-neutral-600 hover:text-brand-600"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-grave text-[10px] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Sidebar para desktop
const Sidebar: React.FC<{
  items: NavItem[];
  logo?: React.ReactNode;
  title?: string;
  onNavigate?: (href: string) => void;
  isOpen: boolean;
  onClose: () => void;
}> = ({ items, logo, title, onNavigate, isOpen, onClose }) => {
  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col",
          "border-r border-neutral-200 bg-white",
          "transform transition-transform duration-200 ease-in-out",
          "md:translate-x-0 md:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menú lateral"
      >
        {/* Logo y título */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <div className="flex items-center gap-3">
            {logo || (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                VS
              </div>
            )}
            {title && <span className="font-semibold text-lg">{title}</span>}
          </div>
          <button
            onClick={onClose}
            className="md:hidden min-h-touch min-w-touch flex items-center justify-center rounded-md hover:bg-neutral-100"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto p-4" role="navigation">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => {
                    onNavigate?.(item.href);
                    onClose();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base",
                    "min-h-touch transition-colors",
                    item.active
                      ? "bg-brand-100 text-brand-700 font-medium"
                      : "text-neutral-700 hover:bg-neutral-100"
                  )}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

// Header para desktop y móvil
const Header: React.FC<{
  user?: UserData;
  onMenuClick: () => void;
  onLogout?: () => void;
  notifications?: number;
  onNotificationsClick?: () => void;
}> = ({ user, onMenuClick, onLogout, notifications, onNotificationsClick }) => {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4">
      {/* Botón menú móvil */}
      <button
        onClick={onMenuClick}
        className="md:hidden min-h-touch min-w-touch flex items-center justify-center rounded-md hover:bg-neutral-100"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Spacer para desktop */}
      <div className="hidden md:block" />

      {/* Acciones del header */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        {onNotificationsClick && (
          <button
            onClick={onNotificationsClick}
            className="relative min-h-touch min-w-touch flex items-center justify-center rounded-md hover:bg-neutral-100"
            aria-label={`Notificaciones${notifications ? `, ${notifications} sin leer` : ""}`}
          >
            <Bell className="h-5 w-5 text-neutral-600" />
            {notifications && notifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-grave px-1 text-[10px] text-white">
                {notifications > 99 ? "99+" : notifications}
              </span>
            )}
          </button>
        )}

        {/* Usuario */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 min-h-touch"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <Avatar
                nombre={user.nombre}
                apellido={user.apellido}
                src={user.avatarUrl}
                size="sm"
              />
              <span className="hidden sm:block text-sm font-medium">
                {user.nombre}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </button>

            {/* Dropdown menú usuario */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-card border border-neutral-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-neutral-200 px-4 py-3">
                    <p className="font-medium">
                      {user.nombre} {user.apellido}
                    </p>
                    <p className="text-sm text-neutral-500">{user.email}</p>
                    {user.rol && (
                      <p className="text-xs text-brand-600 mt-1">{user.rol}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 min-h-touch"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  user,
  logo,
  title = "VecinoSimple",
  onNavigate,
  onLogout,
  notifications,
  onNotificationsClick,
  footer,
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar
        items={navItems}
        logo={logo}
        title={title}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col md:ml-0">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          notifications={notifications}
          onNotificationsClick={onNotificationsClick}
        />

        {/* Contenido principal */}
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Footer opcional */}
        {footer && (
          <footer className="hidden md:block border-t border-neutral-200 p-4">
            {footer}
          </footer>
        )}
      </div>

      {/* Navegación móvil inferior */}
      <MobileNav items={navItems} onNavigate={onNavigate} />
    </div>
  );
};

DashboardLayout.displayName = "DashboardLayout";
