import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Printer } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useBehavioralContent, CategoryCode, QuadrantCode } from '../../../hooks/useBehavioralProfile'
import { BehavioralResult } from '../../../hooks/useResumes'
import { BrainQuadrantDiagram } from './BrainQuadrantDiagram'

interface BehavioralProfileCardProps {
  result: BehavioralResult
}

type Tab = 'perfil' | 'cerebral' | 'respostas'

const ANIMAL_PHOTOS: Record<CategoryCode, string> = {
  E: '/animals/tubarao.jpg',
  C: '/animals/gato.jpg',
  A: '/animals/lobo.jpg',
  V: '/animals/aguia.jpg',
}

export function BehavioralProfileCard({ result }: BehavioralProfileCardProps) {
  const [tab, setTab] = useState<Tab>('perfil')
  const { data: content } = useBehavioralContent()

  const profileByCode = new Map(content?.profiles.map((p) => [p.code, p]))
  const quadrantByCode = new Map(content?.quadrants.map((q) => [q.code, q]))

  const dominant = profileByCode.get(result.dominantProfile)
  const secondary = profileByCode.get(result.secondaryProfile)

  const categoryData = (['E', 'C', 'A', 'V'] as CategoryCode[]).map((code) => {
    const points = { E: result.pointsE, C: result.pointsC, A: result.pointsA, V: result.pointsV }[code]
    const profile = profileByCode.get(code)
    return {
      code,
      name: profile?.animalName ?? code,
      pct: (points / 25) * 100,
      color: profile?.color ?? '#94A3B8',
    }
  })

  const quadrantData: { code: QuadrantCode; pct: number }[] = [
    { code: 'INSPIRACAO', pct: result.pctInspiracao },
    { code: 'IMPULSO', pct: result.pctImpulso },
    { code: 'EXECUCAO', pct: result.pctExecucao },
    { code: 'ESTRATEGIA', pct: result.pctEstrategia },
  ]

  const diagramRegions = quadrantData.map((q) => ({
    region: quadrantByCode.get(q.code)?.brainRegion ?? ('Anterior' as const),
    pct: q.pct,
  }))

  const traitRow = (label: string, field: 'mainCharacteristics' | 'behavioralTraits' | 'strengths' | 'improvementPoints' | 'motivations' | 'values') => (
    <div>
      <dt className="text-xs font-semibold text-slate-700">{label}</dt>
      {dominant && <dd className="text-xs text-slate-600 mt-0.5">{dominant[field]}</dd>}
      {secondary && <dd className="text-xs text-slate-500 mt-0.5">{secondary[field]}</dd>}
    </div>
  )

  return (
    <Card className="behavioral-profile-card">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h3 className="font-semibold text-slate-900">Perfil Comportamental</h3>
        <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-600" title="Exportar PDF">
          <Printer className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-1 mb-4 print:hidden flex-wrap">
        {(
          [
            ['perfil', 'Perfil Comportamental'],
            ['cerebral', 'Preferência Cerebral'],
            ['respostas', 'Respostas'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
              tab === key ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className="space-y-4 text-sm">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryData} dataKey="pct" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
                {categoryData.map((c) => (
                  <Cell key={c.code} fill={c.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-2">
            {categoryData.map((c) => (
              <div key={c.code} className="flex items-center gap-1.5 text-xs">
                <img
                  src={ANIMAL_PHOTOS[c.code]}
                  alt={c.name}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                  style={{ boxShadow: `0 0 0 2px ${c.color}` }}
                />
                <span className="text-slate-600">
                  {c.name} <span className="text-slate-400">{c.pct.toFixed(0)}%</span>
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {dominant && (
              <div className="flex items-center gap-2">
                <img
                  src={ANIMAL_PHOTOS[dominant.code]}
                  alt={dominant.animalName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  style={{ boxShadow: `0 0 0 2px ${dominant.color}` }}
                />
                <span className="text-xs text-slate-700">
                  <span className="font-semibold">{dominant.animalName}</span> — {dominant.tagline}
                </span>
              </div>
            )}
            {secondary && (
              <div className="flex items-center gap-2">
                <img
                  src={ANIMAL_PHOTOS[secondary.code]}
                  alt={secondary.animalName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  style={{ boxShadow: `0 0 0 2px ${secondary.color}` }}
                />
                <span className="text-xs text-slate-600">
                  <span className="font-semibold">{secondary.animalName}</span> — {secondary.tagline}
                </span>
              </div>
            )}
          </div>

          <dl className="space-y-3 pt-3 border-t border-slate-100">
            {traitRow('Traços comportamentais', 'behavioralTraits')}
            {traitRow('Pontos fortes', 'strengths')}
            {traitRow('Pontos de melhoria', 'improvementPoints')}
            {traitRow('Motivações', 'motivations')}
            {traitRow('Valores', 'values')}
          </dl>
        </div>
      )}

      {tab === 'cerebral' && (
        <div className="space-y-4 text-sm">
          <BrainQuadrantDiagram regions={diagramRegions} />

          <div className="space-y-3">
            {quadrantData.map((q) => {
              const quadrant = quadrantByCode.get(q.code)
              if (!quadrant) return null
              const roles = quadrant.categories.map((code) => profileByCode.get(code)?.brainRole ?? code).join(' + ')
              return (
                <div key={q.code} className="pb-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {quadrant.brainRegion} <span className="text-slate-400 font-normal">({roles})</span>
                    </span>
                    <span className="text-xs font-bold text-slate-600">{q.pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5 mb-2">
                    <div className="h-full bg-primary" style={{ width: `${q.pct}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {quadrant.keywords.map((word) => (
                      <span key={word} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px]">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'respostas' && (
        <ol className="space-y-3 text-sm max-h-96 overflow-y-auto">
          {result.answers
            .slice()
            .sort((a, b) => a.questionOrder - b.questionOrder)
            .map((answer) => (
              <li key={answer.id} className="pb-3 border-b border-slate-100 last:border-0">
                <p className="text-xs text-slate-400 mb-0.5">
                  {answer.questionOrder}. {answer.questionText}
                </p>
                <p className="text-slate-700">{answer.answerText}</p>
              </li>
            ))}
        </ol>
      )}
    </Card>
  )
}
