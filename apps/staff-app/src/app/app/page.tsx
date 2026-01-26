'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, getPendingSync } from '@/offline/db';

interface Stats {
  bitacoraHoy: number;
  paquetesPendientes: number;
  ultimaRonda: Date | null;
  pendientesSync: number;
}

export default function AppHomePage() {
  const [stats, setStats] = useState<Stats>({
    bitacoraHoy: 0,
    paquetesPendientes: 0,
    ultimaRonda: null,
    pendientesSync: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Contar entradas de bitácora de hoy
      const bitacoraHoy = await db.bitacora
        .where('timestamp')
        .aboveOrEqual(hoy)
        .count();

      // Contar paquetes sin entregar
      const paquetesPendientes = await db.paquetes
        .filter((p) => !p.entregadoAt)
        .count();

      // Última ronda
      const ultimaRonda = await db.rondas.orderBy('inicioAt').last();

      // Pendientes de sync
      const pending = await getPendingSync();
      const pendientesSync =
        pending.bitacora.length +
        pending.paquetes.length +
        pending.rondas.length;

      setStats({
        bitacoraHoy,
        paquetesPendientes,
        ultimaRonda: ultimaRonda?.inicioAt || null,
        pendientesSync,
      });
    };

    loadStats();
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Sin registro';
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Estado de conexión */}
      <div
        className={`rounded-xl p-4 ${
          isOnline ? 'bg-green-100' : 'bg-yellow-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{isOnline ? '🌐' : '📴'}</span>
          <div>
            <p
              className={`font-medium ${
                isOnline ? 'text-green-800' : 'text-yellow-800'
              }`}
            >
              {isOnline ? 'Conectado' : 'Sin conexión'}
            </p>
            <p
              className={`text-sm ${
                isOnline ? 'text-green-600' : 'text-yellow-600'
              }`}
            >
              {isOnline
                ? 'Los datos se sincronizan automáticamente'
                : 'Los cambios se guardan localmente'}
            </p>
          </div>
        </div>
        {stats.pendientesSync > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {stats.pendientesSync} registro(s) pendiente(s) de sincronizar
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickAction
          href="/app/bitacora/nuevo"
          icon="📝"
          label="Nueva entrada"
          subtitle="Bitácora"
          color="bg-blue-500"
        />
        <QuickAction
          href="/app/paquetes/recibir"
          icon="📦"
          label="Recibir paquete"
          subtitle="Paquetería"
          color="bg-green-500"
        />
        <QuickAction
          href="/app/rondas/nueva"
          icon="🔒"
          label="Iniciar ronda"
          subtitle="Vigilancia"
          color="bg-purple-500"
        />
        <QuickAction
          href="/app/paquetes/entregar"
          icon="✅"
          label="Entregar paquete"
          subtitle={`${stats.paquetesPendientes} pendientes`}
          color="bg-orange-500"
        />
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Resumen del día</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon="📋"
            label="Entradas hoy"
            value={stats.bitacoraHoy.toString()}
          />
          <StatCard
            icon="📦"
            label="Paquetes pendientes"
            value={stats.paquetesPendientes.toString()}
          />
          <StatCard
            icon="🕐"
            label="Última ronda"
            value={formatTime(stats.ultimaRonda)}
          />
          <StatCard
            icon="🔄"
            label="Por sincronizar"
            value={stats.pendientesSync.toString()}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">Actividad reciente</h2>
          <Link
            href="/app/bitacora"
            className="text-blue-600 text-sm font-medium"
          >
            Ver todo
          </Link>
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  subtitle,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow min-h-[100px] flex flex-col justify-between"
    >
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-xl`}>
        {icon}
      </div>
      <div className="mt-2">
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function RecentActivity() {
  const [activities, setActivities] = useState<
    {
      localId: string;
      tipo: string;
      descripcion: string;
      timestamp: Date;
      syncStatus: string;
    }[]
  >([]);

  useEffect(() => {
    const loadRecent = async () => {
      const recent = await db.bitacora.orderBy('timestamp').reverse().limit(5).toArray();
      setActivities(recent);
    };

    loadRecent();
  }, []);

  if (activities.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        No hay actividad reciente
      </p>
    );
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'ingreso_visita':
        return '👤';
      case 'ronda':
        return '🔒';
      case 'incidente':
        return '⚠️';
      case 'novedad':
        return '📝';
      default:
        return '📋';
    }
  };

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.localId}
          className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
        >
          <span className="text-xl">{getTipoIcon(activity.tipo)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 truncate">
              {activity.descripcion}
            </p>
            <p className="text-xs text-gray-500">
              {formatTime(activity.timestamp)}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              activity.syncStatus === 'synced'
                ? 'badge-synced'
                : activity.syncStatus === 'error'
                ? 'badge-error'
                : 'badge-pending'
            }`}
          >
            {activity.syncStatus === 'synced'
              ? '✓'
              : activity.syncStatus === 'error'
              ? '!'
              : '↻'}
          </span>
        </div>
      ))}
    </div>
  );
}
