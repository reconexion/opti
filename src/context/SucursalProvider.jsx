import { useState } from 'react'
import { listSucursales } from '../lib/storage.js'
import { SucursalContext } from './sucursalContext.js'

const STORAGE_KEY = 'optiscale_sucursal_activa'

function valorInicial() {
  try {
    const guardada = localStorage.getItem(STORAGE_KEY)
    if (guardada) return guardada
  } catch {
    /* localStorage no disponible */
  }
  return listSucursales()[0]?.nombre || ''
}

export function SucursalProvider({ children }) {
  const [sucursalActiva, setSucursalActivaState] = useState(valorInicial)
  const [sucursales, setSucursales] = useState(() => listSucursales())

  function setSucursalActiva(valor) {
    setSucursalActivaState(valor)
    try {
      localStorage.setItem(STORAGE_KEY, valor)
    } catch {
      /* localStorage no disponible */
    }
  }

  function refreshSucursales() {
    setSucursales(listSucursales())
  }

  return (
    <SucursalContext.Provider value={{ sucursalActiva, setSucursalActiva, sucursales, refreshSucursales }}>
      {children}
    </SucursalContext.Provider>
  )
}
