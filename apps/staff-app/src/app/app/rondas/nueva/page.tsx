'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { db, generateLocalId, type RondaLocal } from '@/offline/db';

const CHECKPOINTS = [
  { id: 'hall', label: 'Hall de entrada', icon: '🚪' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'terraza', label: 'Terraza', icon: '🏠' },
  { id: 'sum', label: 'SUM', icon: '🎉' },
  { id: 'pileta', label: 'Pileta', icon: '🏊' },
  { id: 'escaleras', label: 'Escaleras', icon: '🔼' },
  { id: 'subsuelo', label: 'Subsuelo', icon: '⬇️' },
  { id: 'medidores', label: 'Medidores', icon: '📊' },
];

export default function NuevaRondaPage() {
  const router = useRouter();
  const [ronda, setRonda] = useState<RondaLocal | null>(null);
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Iniciar la ronda al cargar la página
  useEffect(() => {
    const initRonda = async () => {
      const consorcioId = localStorage.getItem('consorcioId') || 'default';
      
      const nuevaRonda: RondaLocal = {
        localId: generateLocalId(),
        consorcioId,
        inicioAt: new Date(),
        checkpoints: [],
        syncStatus: 'pending',
      };

      await db.rondas.add(nuevaRonda);
      setRonda(nuevaRonda);
    };

    initRonda();
  }, []);

  const handleCheckpoint = async (checkpointId: string) => {
    if (!ronda) return;

    const checkpoint = CHECKPOINTS.find((c) => c.id === checkpointId);
    if (!checkpoint) return;

    const nuevoCheckpoint = {
      ubicacion: checkpoint.label,
      timestamp: new Date(),
      notas: notas || undefined,
    };

    const nuevosCheckpoints = [...ronda.checkpoints, nuevoCheckpoint];

    await db.rondas.update(ronda.localId, {
      checkpoints: nuevosCheckpoints,
    });

    setRonda({
      ...ronda,
      checkpoints: nuevosCheckpoints,
    });

    setNotas('');
  };

  const handleFinalizarRonda = async () => {
    if (!ronda) return;
    setIsLoading(true);

    try {
      const finAt = new Date();
      
      await db.rondas.update(ronda.localId, {
        finAt,
      });

      // Intentar sincronizar
      if (navigator.onLine) {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/rondas`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ...ronda, finAt }),
            }
          );

          if (response.ok) {
            const serverData = await response.json();
            await db.rondas.update(ronda.localId, {
              syncStatus: 'synced',
              serverData,
            });
          }
        } catch {
          // Si falla, queda pendiente - se reintentará con el sync manager
        }
      }

      router.push('/app/rondas');
    } finally {
      setIsLoading(false);
    }
  };

  const checkpointsCompletados = ronda?.checkpoints.map((c) => c.ubicacion) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
            href="/app/rondas"
          >
            ←
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Ronda en curso</h1>
        </div>
        {ronda && (
          <span className="text-sm text-gray-500">
            {ronda.checkpoints.length} checkpoint(s)
          </span>
        )}
      </div>

      {/* Tiempo transcurrido */}
      {ronda && <TimerDisplay startTime={ronda.inicioAt} />}

      {/* Notas para el próximo checkpoint */}
      <div className="bg-white rounded-xl p-4 shadow">
        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">
            Notas para el checkpoint (opcional)
          </span>
          <input
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            placeholder="Ej: Todo en orden, luz fundida, etc."
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </label>
      </div>

      {/* Checkpoints */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold text-gray-800 mb-4">Registrar checkpoint</h2>
        <div className="grid grid-cols-2 gap-3">
          {CHECKPOINTS.map((checkpoint) => {
            const isCompleted = checkpointsCompletados.includes(checkpoint.label);
            return (
              <button
                className={`p-4 rounded-xl text-left transition-all border-2 min-h-[80px] ${
                  isCompleted
                    ? 'border-green-500 bg-green-50 opacity-70'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-95'
                }`}
                disabled={isCompleted}
                key={checkpoint.id}
                onClick={() => handleCheckpoint(checkpoint.id)}
              >
                <span className="text-2xl block mb-1">{checkpoint.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {checkpoint.label}
                </span>
                {isCompleted && (
                  <span className="text-xs text-green-600 block mt-1">✓ Listo</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Historial de checkpoints */}
      {ronda && ronda.checkpoints.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold text-gray-800 mb-4">
            Checkpoints registrados
          </h2>
          <div className="space-y-3">
            {ronda.checkpoints.map((checkpoint, index) => (
              <div
                className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
                key={index}
              >
                <span className="text-green-500 mt-0.5">✓</span>
                <div className="flex-1">
                  <p className="text-gray-800 font-medium">
                    {checkpoint.ubicacion}
                  </p>
                  {checkpoint.notas && (
                    <p className="text-sm text-gray-500">{checkpoint.notas}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {new Date(checkpoint.timestamp).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Finalizar */}
      <button
        className="w-full py-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
        disabled={isLoading || !ronda || ronda.checkpoints.length === 0}
        onClick={handleFinalizarRonda}
      >
        {isLoading ? 'Finalizando...' : 'Finalizar ronda'}
      </button>
    </div>
  );
}

function TimerDisplay({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const updateTimer = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="bg-purple-100 rounded-xl p-4 text-center">
      <p className="text-sm text-purple-600 mb-1">Tiempo transcurrido</p>
      <p className="text-3xl font-mono font-bold text-purple-800">{elapsed}</p>
    </div>
  );
}
