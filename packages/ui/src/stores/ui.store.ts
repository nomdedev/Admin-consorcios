import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// =============================================================================
// UI Store - Preferencias de interfaz y accesibilidad
// =============================================================================

export type UIMode = "completo" | "simplificado";
export type UITheme = "claro" | "oscuro" | "auto";
export type TextSize = "normal" | "grande" | "extra-grande";

interface UIState {
  // Modo de interfaz (Abuela-Proof)
  modo: UIMode;
  
  // Tema visual
  tema: UITheme;
  
  // Tamaño de texto para accesibilidad
  tamanoTexto: TextSize;
  
  // Estado de la sidebar (desktop)
  sidebarAbierto: boolean;
  
  // Consorcio activo (para usuarios con múltiples consorcios)
  consorcioActivoId: string | null;
  
  // Unidad Funcional activa (para usuarios con múltiples UFs)
  unidadFuncionalActivaId: string | null;
}

interface UIActions {
  setModo: (modo: UIMode) => void;
  setTema: (tema: UITheme) => void;
  setTamanoTexto: (tamano: TextSize) => void;
  toggleSidebar: () => void;
  setSidebarAbierto: (abierto: boolean) => void;
  setConsorcioActivo: (id: string | null) => void;
  setUnidadFuncionalActiva: (id: string | null) => void;
  reset: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  modo: "completo",
  tema: "auto",
  tamanoTexto: "normal",
  sidebarAbierto: true,
  consorcioActivoId: null,
  unidadFuncionalActivaId: null,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      setModo: (modo) => set({ modo }),
      
      setTema: (tema) => set({ tema }),
      
      setTamanoTexto: (tamanoTexto) => set({ tamanoTexto }),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarAbierto: !state.sidebarAbierto })),
      
      setSidebarAbierto: (sidebarAbierto) => set({ sidebarAbierto }),
      
      setConsorcioActivo: (consorcioActivoId) => 
        set({ consorcioActivoId, unidadFuncionalActivaId: null }),
      
      setUnidadFuncionalActiva: (unidadFuncionalActivaId) =>
        set({ unidadFuncionalActivaId }),
      
      reset: () => set(initialState),
    }),
    {
      name: "vecinosimple-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        modo: state.modo,
        tema: state.tema,
        tamanoTexto: state.tamanoTexto,
        consorcioActivoId: state.consorcioActivoId,
        unidadFuncionalActivaId: state.unidadFuncionalActivaId,
      }),
    }
  )
);

// =============================================================================
// Utilidades para aplicar preferencias
// =============================================================================

/**
 * Obtiene las clases CSS para el tamaño de texto
 */
export function getTextSizeClass(size: TextSize): string {
  switch (size) {
    case "normal":
      return "text-base"; // 18px
    case "grande":
      return "text-lg"; // 20px
    case "extra-grande":
      return "text-xl"; // 24px
    default:
      return "text-base";
  }
}

/**
 * Obtiene el tamaño base en pixeles
 */
export function getTextSizePixels(size: TextSize): number {
  switch (size) {
    case "normal":
      return 18;
    case "grande":
      return 20;
    case "extra-grande":
      return 24;
    default:
      return 18;
  }
}

/**
 * Hook para obtener el tema efectivo considerando preferencia del sistema
 */
export function useEffectiveTheme(): "claro" | "oscuro" {
  const { tema } = useUIStore();
  
  if (tema !== "auto") {
    return tema;
  }
  
  // En el servidor, defaultear a claro
  if (typeof window === "undefined") {
    return "claro";
  }
  
  // Verificar preferencia del sistema
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "oscuro"
    : "claro";
}
