// Mapeo compartido de texto de clasificación clínica -> clase visual de insignia.
// Usado por el reporte y por el panel de estadísticas para que el mismo
// nivel/clasificación siempre se vea con el mismo color en toda la app.

export const NIVEL_BADGE = {
  Normal: 'badge--neutral',
  Leve: 'badge--good',
  Bajo: 'badge--good',
  Óptimo: 'badge--good',
  Aceptable: 'badge--warn',
  Moderada: 'badge--warn',
  Moderado: 'badge--warn',
  Medio: 'badge--warn',
  Alta: 'badge--bad',
  Alto: 'badge--bad',
  Severo: 'badge--bad',
  Insuficiente: 'badge--bad',
  'Sin astigmatismo': 'badge--neutral',
}

export const COMPARACION_BADGE = {
  'Sin registro previo': 'badge--neutral',
  'Sin cambio': 'badge--neutral',
  Mejoró: 'badge--good',
  Estable: 'badge--good',
  'Ajuste leve': 'badge--warn',
  'Cambio moderado': 'badge--warn',
  'Cambio importante': 'badge--bad',
}

// Colores planos (no clase CSS) para usar como relleno de barras en gráficas.
export const NIVEL_COLOR = {
  Normal: '#8991a1',
  Bajo: '#1a8f5e',
  Medio: '#b9740a',
  Alto: '#c8393d',
}

export const COMPARACION_COLOR = {
  'Sin cambio': '#8991a1',
  Mejoró: '#1a8f5e',
  Estable: '#1a8f5e',
  'Ajuste leve': '#b9740a',
  'Cambio moderado': '#b9740a',
  'Cambio importante': '#c8393d',
}
