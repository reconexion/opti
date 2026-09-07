// Gráfica comparativa de evolución (RX anterior vs. actual), en SVG plano.
// Solo grafica esfera y cilindro (magnitudes en dioptrías); eje y adición
// quedan en la tabla numérica de arriba.

const CATEGORIES = [
  { key: 'od-esfera', label: 'OD Esfera', ojo: 'od', campo: 'esfera' },
  { key: 'od-cilindro', label: 'OD Cilindro', ojo: 'od', campo: 'cilindro' },
  { key: 'oi-esfera', label: 'OI Esfera', ojo: 'oi', campo: 'esfera' },
  { key: 'oi-cilindro', label: 'OI Cilindro', ojo: 'oi', campo: 'cilindro' },
]

const COLOR_ANTERIOR = '#8991a1' // var(--ink-faint)
const COLOR_ACTUAL = '#2454d6' // var(--blue)

function num(v) {
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

function roundedBarPath(x, width, yTip, yBase, radius) {
  const height = Math.abs(yBase - yTip)
  const r = Math.min(radius, height / 2 || 0)
  if (r <= 0.5) {
    // Valor ~0: barra casi plana, sin curvatura.
    return `M ${x},${yBase} L ${x},${yTip} L ${x + width},${yTip} L ${x + width},${yBase} Z`
  }
  if (yTip < yBase) {
    // Valor positivo: la barra crece hacia arriba, esquinas redondeadas arriba.
    return `M ${x},${yBase}
      L ${x},${yTip + r}
      Q ${x},${yTip} ${x + r},${yTip}
      L ${x + width - r},${yTip}
      Q ${x + width},${yTip} ${x + width},${yTip + r}
      L ${x + width},${yBase}
      Z`
  }
  // Valor negativo: la barra crece hacia abajo, esquinas redondeadas abajo.
  return `M ${x},${yBase}
    L ${x},${yTip - r}
    Q ${x},${yTip} ${x + r},${yTip}
    L ${x + width - r},${yTip}
    Q ${x + width},${yTip} ${x + width},${yTip - r}
    L ${x + width},${yBase}
    Z`
}

export default function RxComparisonChart({ anterior, actual }) {
  const width = 560
  const height = 230
  const marginTop = 24
  const marginBottom = 32
  const marginX = 20
  const plotWidth = width - marginX * 2
  const plotHeight = height - marginTop - marginBottom
  const baseline = marginTop + plotHeight / 2

  const values = CATEGORIES.flatMap(({ ojo, campo }) => [
    num(anterior?.[ojo]?.[campo]),
    num(actual?.[ojo]?.[campo]),
  ])
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v))) * 1.2
  const gridSteps = [0.25, 0.5, 0.75, 1]

  const categoryWidth = plotWidth / CATEGORIES.length
  const barThickness = Math.min(24, categoryWidth / 2 - 10)
  const gap = 4

  function yFor(v) {
    return baseline - (v / maxAbs) * (plotHeight / 2)
  }

  return (
    <figure style={{ margin: 0, width: '100%' }}>
      <figcaption
        style={{
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          fontSize: 13,
          color: 'var(--ink-soft)',
          marginBottom: 6,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: COLOR_ANTERIOR,
              display: 'inline-block',
            }}
          />
          Anterior
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: COLOR_ACTUAL,
              display: 'inline-block',
            }}
          />
          Actual
        </span>
        <span style={{ color: 'var(--ink-faint)' }}>Valores en dioptrías (D)</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Gráfica comparativa de graduación anterior contra actual, por ojo"
      >
        {gridSteps.map((step) => {
          const yTop = baseline - step * (plotHeight / 2)
          const yBottom = baseline + step * (plotHeight / 2)
          return (
            <g key={step}>
              <line x1={marginX} y1={yTop} x2={width - marginX} y2={yTop} stroke="var(--border, #e3e6ed)" strokeWidth="1" />
              <line x1={marginX} y1={yBottom} x2={width - marginX} y2={yBottom} stroke="var(--border, #e3e6ed)" strokeWidth="1" />
            </g>
          )
        })}
        <line
          x1={marginX}
          y1={baseline}
          x2={width - marginX}
          y2={baseline}
          stroke="var(--border-strong, #cbd1de)"
          strokeWidth="1"
        />

        {CATEGORIES.map(({ key, label, ojo, campo }, i) => {
          const catX = marginX + i * categoryWidth
          const center = catX + categoryWidth / 2
          const xAnterior = center - gap / 2 - barThickness
          const xActual = center + gap / 2

          const vAnterior = num(anterior?.[ojo]?.[campo])
          const vActual = num(actual?.[ojo]?.[campo])
          const yAnterior = yFor(vAnterior)
          const yActual = yFor(vActual)

          const labelYAnterior = yAnterior <= baseline ? yAnterior - 6 : yAnterior + 14
          const labelYActual = yActual <= baseline ? yActual - 6 : yActual + 14

          return (
            <g key={key}>
              <path d={roundedBarPath(xAnterior, barThickness, yAnterior, baseline, 4)} fill={COLOR_ANTERIOR} />
              <path d={roundedBarPath(xActual, barThickness, yActual, baseline, 4)} fill={COLOR_ACTUAL} />

              <text x={xAnterior + barThickness / 2} y={labelYAnterior} textAnchor="middle" fontSize="11" fill="var(--ink-soft, #565e6d)">
                {vAnterior}
              </text>
              <text x={xActual + barThickness / 2} y={labelYActual} textAnchor="middle" fontSize="11" fill="var(--ink-soft, #565e6d)">
                {vActual}
              </text>

              <text
                x={center}
                y={height - marginBottom + 18}
                textAnchor="middle"
                fontSize="12"
                fill="var(--ink-faint, #8991a1)"
              >
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
