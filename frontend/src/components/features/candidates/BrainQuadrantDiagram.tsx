const CX = 160
const CY = 160
const R_IMAGE = 90
const R_REGION_LABEL = 108
const R_CORNER_LABEL = 132

const BASE_RADIUS = 42
const AMPLIFY = 2.4
const MIN_RADIUS = 14
const MAX_RADIUS = 76

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) }
}

function blobRadius(pct: number) {
  const r = BASE_RADIUS + (pct - 25) * AMPLIFY
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, r))
}

// N=Anterior, E=Direito, S=Posterior, W=Esquerdo (0°=east, 90°=south, 180°=west, 270°=north)
const REGION_ANGLE: Record<string, number> = {
  Anterior: 270,
  Direito: 0,
  Posterior: 90,
  Esquerdo: 180,
}

const REGION_FORMULA: Record<string, string> = {
  Anterior: 'O+I',
  Direito: 'I+C',
  Posterior: 'C+A',
  Esquerdo: 'O+A',
}

const CORNER_LABELS: { text: string; angle: number; anchor: 'start' | 'end' }[] = [
  { text: 'ORGANIZADOR', angle: 225, anchor: 'end' },
  { text: 'IDEALIZADOR', angle: 315, anchor: 'start' },
  { text: 'COMUNICADOR', angle: 45, anchor: 'start' },
  { text: 'ATIVADOR/AÇÃO', angle: 135, anchor: 'end' },
]

interface BrainQuadrantDiagramProps {
  regions: { region: 'Anterior' | 'Direito' | 'Posterior' | 'Esquerdo'; pct: number }[]
}

export function BrainQuadrantDiagram({ regions }: BrainQuadrantDiagramProps) {
  const points = regions.map((r) => ({ ...r, ...polar(REGION_ANGLE[r.region], blobRadius(r.pct)) }))
  const dominant = regions.reduce((a, b) => (b.pct > a.pct ? b : a))
  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[260px] mx-auto">
      <text x={CX} y={12} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold uppercase">
        Pensante
      </text>
      <text x={CX} y={314} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold uppercase">
        Atuante
      </text>

      <image
        href="/diagrams/cerebro.png"
        x={CX - R_IMAGE}
        y={CY - R_IMAGE}
        width={R_IMAGE * 2}
        height={R_IMAGE * 2}
        className="grayscale opacity-50"
      />

      <polygon points={polygon} fill="#334155" fillOpacity={0.55} stroke="#1e293b" strokeWidth={1.5} />
      {points.map((p) => (
        <circle key={p.region} cx={p.x} cy={p.y} r={3} fill="#1e293b" />
      ))}

      {points.map((p) => {
        const labelPos = polar(REGION_ANGLE[p.region], R_REGION_LABEL)
        const anchor = p.region === 'Direito' ? 'start' : p.region === 'Esquerdo' ? 'end' : 'middle'
        return (
          <g key={p.region}>
            <text
              x={labelPos.x}
              y={labelPos.y - 9}
              textAnchor={anchor}
              className={`text-[9px] font-semibold ${p.region === dominant.region ? 'fill-slate-800' : 'fill-slate-500'}`}
            >
              {p.region}
            </text>
            <text x={labelPos.x} y={labelPos.y + 1} textAnchor={anchor} className="fill-slate-400 text-[7px]">
              ({REGION_FORMULA[p.region]})
            </text>
            <text
              x={labelPos.x}
              y={labelPos.y + 13}
              textAnchor={anchor}
              className={`text-[11px] font-bold ${p.region === dominant.region ? 'fill-slate-800' : 'fill-slate-500'}`}
            >
              {p.pct.toFixed(0)}%
            </text>
          </g>
        )
      })}

      {CORNER_LABELS.map((c) => {
        const pos = polar(c.angle, R_CORNER_LABEL)
        return (
          <text key={c.text} x={pos.x} y={pos.y} textAnchor={c.anchor} className="fill-slate-500 text-[8px] font-bold">
            {c.text}
          </text>
        )
      })}

      <text
        x={CX + 55}
        y={CY + 45}
        textAnchor="middle"
        className="fill-slate-400 text-[8px] italic"
      >
        Área de Plotagem
      </text>
    </svg>
  )
}
