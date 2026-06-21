"use client";

import {
  DashboardLayout as UILayout,
  type NavItem,
  type UserData,
} from "@vecinosimple/ui";
import {
  Home,
  Building2,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  Settings,
  PieChart,
  Ticket,
  Bell,
  CalendarDays,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth, useLogout } from "@/features/auth";
import { useContadorNotificaciones } from "@/features/notificaciones";

const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/",
    icon: <Home className="h-5 w-5" />,
  },
  {
    label: "Consorcios",
    href: "/consorcios",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    label: "Usuarios",
    href: "/usuarios",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Expensas",
    href: "/expensas",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Gastos",
    href: "/gastos",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "Pagos",
    href: "/pagos",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: <Ticket className="h-5 w-5" />,
  },
  {
    label: "Comunicados",
    href: "/comunicados",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: "Amenities",
    href: "/amenities",
    icon: <CalendarDays className="h-5 w-5" />,
  },
  {
    label: "Notificaciones",
    href: "/notificaciones",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: <PieChart className="h-5 w-5" />,
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Autenticación
  const { user, isAdmin } = useAuth();
  const logout = useLogout();
  
  // Datos del usuario para el layout
  const userData: UserData = user ? {
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    rol: isAdmin ? 'Administrador' : 'Staff',
  } : {
    nombre: 'Usuario',
    apellido: '',
    email: '',
    rol: 'Cargando...',
  };
  
  // Obtener contador de notificaciones sin leer
  const { data: contadorData } = useContadorNotificaciones();
  const notificacionesSinLeer = contadorData?.noLeidas ?? 0;

  // Marcar el item activo
  const itemsConActivo = navItems.map((item) => ({
    ...item,
    active: pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)),
  }));

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const handleLogout = () => {
    logout.mutate();
  };
  
  const handleNotificationsClick = () => {
    router.push("/notificaciones");
  };

  return (
    <UILayout
      navItems={itemsConActivo}
      notifications={notificacionesSinLeer}
      title="VecinoSimple"
      user={userData}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      onNotificationsClick={handleNotificationsClick}
    >
      {children}
    </UILayout>
  );
}
