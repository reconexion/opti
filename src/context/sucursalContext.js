// Lógica y hook del contexto de sucursal activa. El componente Provider
// (que sí tiene JSX) vive en SucursalProvider.jsx, en un archivo aparte,
// para no romper el Fast Refresh de Vite.
import { createContext, useContext } from 'react'

export const TODAS_LAS_SUCURSALES = 'TODAS'
export const SucursalContext = createContext(null)

export function useSucursal() {
  const ctx = useContext(SucursalContext)
  if (!ctx) throw new Error('useSucursal debe usarse dentro de SucursalProvider')
  return ctx
}

export function coincideSucursal(valorSucursal, activa) {
  return activa === TODAS_LAS_SUCURSALES || valorSucursal === activa
}

// Sucursales (nombre + foto) vive en este contexto como estado reactivo, no
// como una simple lectura de localStorage en cada render: si un componente
// que no se vuelve a montar (como el logo de la barra lateral) leyera
// localStorage directamente, un cambio hecho en otra pantalla (ej. subir una
// foto) no se reflejaría hasta la siguiente navegación. `refreshSucursales`
// lo fuerza a actualizarse de inmediato en todos los que lo consulten.
export function useSucursales() {
  const ctx = useContext(SucursalContext)
  if (!ctx) throw new Error('useSucursales debe usarse dentro de SucursalProvider')
  return { sucursales: ctx.sucursales, refreshSucursales: ctx.refreshSucursales }
}
