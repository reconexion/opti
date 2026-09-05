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
