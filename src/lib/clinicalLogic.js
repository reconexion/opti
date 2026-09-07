// Lógica clínica: mismas reglas de clasificación y redacción
// que el Excel "Reporte Evolución Visión", portadas a funciones puras.

export const ANEXOS = [
  { key: 'fondoOjo', label: 'Fondo de ojo' },
  { key: 'reflejosPupilares', label: 'Reflejos pupilares' },
  { key: 'parpadosConjuntiva', label: 'Párpados / conjuntiva' },
  { key: 'presionIntraocular', label: 'Presión intraocular' },
  { key: 'queratometria', label: 'Queratometría' },
  { key: 'coverTest', label: 'Cover test' },
  { key: 'motilidadOcular', label: 'Motilidad ocular' },
  { key: 'corneaCristalino', label: 'Córnea / cristalino' },
  { key: 'agudezaVisual', label: 'Agudeza visual' },
  { key: 'topografiaCorneal', label: 'Topografía corneal' },
  { key: 'estereopsis', label: 'Estereopsis' },
]

export const DIAGNOSTICOS = [
  { key: 'miopia', label: 'Miopía' },
  { key: 'hipermetropia', label: 'Hipermetropía' },
  { key: 'astigmatismo', label: 'Astigmatismo' },
  { key: 'anisometropia', label: 'Anisometropía' },
  { key: 'presbicia', label: 'Presbicia' },
  { key: 'ambliopia', label: 'Ambliopía' },
]

export const GLOSARIO = {
  esfera: 'Esfera: cantidad de dioptrías para corregir miopía (signo negativo) o hipermetropía (signo positivo).',
  cilindro: 'Cilindro: cantidad de dioptrías que corrige el astigmatismo.',
  eje: 'Eje: orientación en grados (0 a 180) del astigmatismo.',
  adicion: 'Adición: dioptrías extra para visión de cerca, usadas en présbitas.',
  cambio: 'Cambio: diferencia entre la graduación anterior y la actual de un paciente.',
}

export const DIAGNOSTICO_EXPLICACION = {
  miopia: 'Miopía: dificultad para ver con claridad los objetos lejanos.',
  hipermetropia: 'Hipermetropía: dificultad para ver con claridad los objetos cercanos.',
  astigmatismo: 'Astigmatismo: visión borrosa o distorsionada por una curvatura irregular del ojo.',
  anisometropia: 'Anisometropía: diferencia significativa de graduación entre ambos ojos.',
  presbicia: 'Presbicia: dificultad para enfocar de cerca asociada a la edad.',
  ambliopia: 'Ambliopía (ojo perezoso): un ojo desarrolla menor agudeza visual que el otro.',
}

function toMinutes(hhmm) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

// 2.2 Horas de sueño y su evaluación
export function calcularHorasSueno(horaDormir, horaDespertar) {
  const dormir = toMinutes(horaDormir)
  const despertar = toMinutes(horaDespertar)
  if (dormir === null || despertar === null) return { horas: null, evaluacion: null }

  let diffMin = despertar - dormir
  if (diffMin <= 0) diffMin += 24 * 60 // cruza medianoche
  const horas = Math.round((diffMin / 60) * 100) / 100

  let evaluacion
  if (horas >= 7) evaluacion = 'Óptimo'
  else if (horas >= 5) evaluacion = 'Aceptable'
  else evaluacion = 'Insuficiente'

  return { horas, evaluacion }
}

// 2.2 Clasificación de ametropía (miopía / hipermetropía) por severidad
export function clasificarAmetropia(esfera) {
  const valor = Number(esfera)
  if (Number.isNaN(valor) || valor === 0) {
    return { tipo: 'Emetropía', nivel: 'Normal' }
  }
  if (valor < 0) {
    const mag = Math.abs(valor)
    let nivel
    if (mag <= 3) nivel = 'Leve'
    else if (mag <= 6) nivel = 'Moderada'
    else nivel = 'Alta'
    return { tipo: 'Miopía', nivel }
  }
  const mag = valor
  let nivel
  if (mag <= 2) nivel = 'Leve'
  else if (mag <= 5) nivel = 'Moderada'
  else nivel = 'Alta'
  return { tipo: 'Hipermetropía', nivel }
}

// 2.2 Clasificación del astigmatismo por magnitud
export function clasificarAstigmatismo(cilindro) {
  const mag = Math.abs(Number(cilindro) || 0)
  if (mag === 0) return 'Sin astigmatismo'
  if (mag <= 1) return 'Leve'
  if (mag <= 2) return 'Moderado'
  return 'Severo'
}

// 2.2 Evaluación del eje del astigmatismo
export function clasificarEjeAstigmatismo(eje, cilindro) {
  const mag = Math.abs(Number(cilindro) || 0)
  const grados = Number(eje)
  if (mag === 0 || Number.isNaN(grados)) {
    return { clasificacion: 'No aplica', requiereAdaptacion: false }
  }
  if ((grados >= 0 && grados <= 10) || (grados >= 170 && grados <= 180)) {
    return { clasificacion: 'Contra la regla', requiereAdaptacion: true }
  }
  if (grados >= 80 && grados <= 100) {
    return { clasificacion: 'Favorable (a favor de la regla)', requiereAdaptacion: false }
  }
  return { clasificacion: 'Oblicuo', requiereAdaptacion: true }
}

// 2.2 Severidad visual global por ojo
export function calcularSeveridadGlobal(esfera, cilindro) {
  const score = Math.abs(Number(esfera) || 0) + Math.abs(Number(cilindro) || 0) * 0.5
  let nivel
  if (score === 0) nivel = 'Normal'
  else if (score <= 2) nivel = 'Bajo'
  else if (score <= 5) nivel = 'Medio'
  else nivel = 'Alto'
  return { score: Math.round(score * 100) / 100, nivel }
}

function ojoTieneDatos(ojo) {
  if (!ojo) return false
  const esfera = ojo.esfera
  const cilindro = ojo.cilindro
  const vacio = (v) => v === '' || v === undefined || v === null
  return !vacio(esfera) || !vacio(cilindro)
}

function rxTieneDatos(rx) {
  return !!rx && (ojoTieneDatos(rx.od) || ojoTieneDatos(rx.oi))
}

// 2.2 Comparación automática RX anterior vs. actual
export function compararGraduacion(anterior, actual) {
  if (!rxTieneDatos(anterior)) {
    return { clasificacion: 'Sin registro previo', deltaMax: null }
  }
  const deltaEsferaOD = Math.abs((Number(actual.od?.esfera) || 0) - (Number(anterior.od?.esfera) || 0))
  const deltaEsferaOI = Math.abs((Number(actual.oi?.esfera) || 0) - (Number(anterior.oi?.esfera) || 0))
  const deltaCilOD = Math.abs((Number(actual.od?.cilindro) || 0) - (Number(anterior.od?.cilindro) || 0))
  const deltaCilOI = Math.abs((Number(actual.oi?.cilindro) || 0) - (Number(anterior.oi?.cilindro) || 0))
  const deltaMax = Math.max(deltaEsferaOD, deltaEsferaOI, deltaCilOD, deltaCilOI)

  const magAnterior =
    Math.abs(Number(anterior.od?.esfera) || 0) +
    Math.abs(Number(anterior.oi?.esfera) || 0) +
    Math.abs(Number(anterior.od?.cilindro) || 0) +
    Math.abs(Number(anterior.oi?.cilindro) || 0)
  const magActual =
    Math.abs(Number(actual.od?.esfera) || 0) +
    Math.abs(Number(actual.oi?.esfera) || 0) +
    Math.abs(Number(actual.od?.cilindro) || 0) +
    Math.abs(Number(actual.oi?.cilindro) || 0)

  let clasificacion
  if (deltaMax === 0) clasificacion = 'Sin cambio'
  else if (magActual < magAnterior) clasificacion = 'Mejoró'
  else if (deltaMax <= 0.25) clasificacion = 'Estable'
  else if (deltaMax <= 0.5) clasificacion = 'Ajuste leve'
  else if (deltaMax <= 1) clasificacion = 'Cambio moderado'
  else clasificacion = 'Cambio importante'

  return { clasificacion, deltaMax: Math.round(deltaMax * 100) / 100 }
}

// Análisis clínico completo de una consulta (para reporte y clasificación en pantalla)
export function analizarConsulta(visita, visitaAnterior) {
  const ojos = ['od', 'oi']
  const porOjo = {}

  for (const ojo of ojos) {
    const rx = visita.rxActual?.[ojo] || {}
    const ametropia = clasificarAmetropia(rx.esfera)
    const astigmatismo = clasificarAstigmatismo(rx.cilindro)
    const eje = clasificarEjeAstigmatismo(rx.eje, rx.cilindro)
    const severidad = calcularSeveridadGlobal(rx.esfera, rx.cilindro)
    porOjo[ojo] = { ametropia, astigmatismo, eje, severidad }
  }

  const sueno = calcularHorasSueno(
    visita.perfilVisual?.horaDormir,
    visita.perfilVisual?.horaDespertar,
  )

  const comparacion = compararGraduacion(
    visitaAnterior ? visitaAnterior.rxActual : visita.rxAnterior,
    visita.rxActual,
  )

  return { porOjo, sueno, comparacion }
}

const NOMBRES_OJO = { od: 'ojo derecho', oi: 'ojo izquierdo' }

function describirOjo(ojo, analisis) {
  const { ametropia, astigmatismo, eje, severidad } = analisis
  let texto = `En tu ${NOMBRES_OJO[ojo]} se registró ${ametropia.tipo.toLowerCase()}`
  if (ametropia.tipo !== 'Emetropía') texto += ` de grado ${ametropia.nivel.toLowerCase()}`
  if (astigmatismo !== 'Sin astigmatismo') {
    texto += `, junto con astigmatismo ${astigmatismo.toLowerCase()} (eje ${eje.clasificacion.toLowerCase()})`
  }
  texto += `. Severidad visual general: ${severidad.nivel.toLowerCase()}.`
  return texto
}

// 2.3 Resumen narrativo personalizado para el paciente
export function generarResumenNarrativo(paciente, visita, analisis) {
  const partes = []
  partes.push(`Hola ${paciente?.nombre || ''}, este es el resumen de tu consulta del ${visita.fecha || ''}.`)

  partes.push(describirOjo('od', analisis.porOjo.od))
  partes.push(describirOjo('oi', analisis.porOjo.oi))

  if (analisis.comparacion.clasificacion !== 'Sin registro previo') {
    partes.push(
      `Comparado con tu graduación anterior, tu resultado se clasifica como: ${analisis.comparacion.clasificacion.toLowerCase()}.`,
    )
  } else {
    partes.push('Esta es tu primera consulta registrada en el sistema, por lo que no hay una graduación anterior con la cual comparar.')
  }

  const diagnosticosMarcados = DIAGNOSTICOS.filter((d) => visita.diagnostico?.[d.key])
  if (diagnosticosMarcados.length > 0) {
    partes.push('Diagnóstico:')
    for (const d of diagnosticosMarcados) {
      partes.push(DIAGNOSTICO_EXPLICACION[d.key])
    }
  }

  if (analisis.sueno.horas !== null) {
    partes.push(
      `Tu tiempo de sueño reportado es de ${analisis.sueno.horas} horas, lo cual se considera ${analisis.sueno.evaluacion.toLowerCase()}.`,
    )
  }

  if (visita.observaciones) {
    partes.push(`Observaciones y recomendaciones del optometrista: ${visita.observaciones}`)
  }

  return partes.join('\n\n')
}

export function validarEje(eje) {
  const v = Number(eje)
  return !Number.isNaN(v) && v >= 0 && v <= 180
}
