import { DashboardLayout } from "./components/dashboard-layout";

import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Dashboard - VecinoSimple Admin",
  description: "Panel de administración de consorcios",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
