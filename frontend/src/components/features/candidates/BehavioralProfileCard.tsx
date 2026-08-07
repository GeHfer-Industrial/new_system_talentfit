import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Printer } from 'lucide-react'
import { Card } from '../../ui/Card'
import { useBehavioralContent, CategoryCode, QuadrantCode } from '../../../hooks/useBehavioralProfile'
import { BehavioralResult } from '../../../hooks/useResumes'
import { BrainQuadrantDiagram } from './BrainQuadrantDiagram'

interface BehavioralProfileCardProps {
  result: BehavioralResult
  candidateName: string
}

type Tab = 'perfil' | 'cerebral' | 'respostas'

const ANIMAL_PHOTOS: Record<CategoryCode, string> = {
  E: '/animals/tubarao.jpg',
  C: '/animals/gato.jpg',
  A: '/animals/lobo.jpg',
  V: '/animals/aguia.jpg',
}

export function BehavioralProfileCard({ result, candidateName }: BehavioralProfileCardProps) {
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

  type TraitField = 'behavioralTraits' | 'strengths' | 'improvementPoints' | 'motivations' | 'values'

  const traitRow = (label: string, field: TraitField) => (
    <div>
      <dt className="text-xs font-semibold text-slate-700">{label}</dt>
      {dominant && <dd className="text-xs text-slate-600 mt-0.5">{dominant[field]}</dd>}
      {secondary && <dd className="text-xs text-slate-500 mt-0.5">{secondary[field]}</dd>}
    </div>
  )

  const printTraitRow = (label: string, field: TraitField) => (
    <div className="mb-4">
      <dt className="text-sm font-bold text-slate-700 mb-1">{label}</dt>
      {dominant && (
        <dd className="text-sm text-slate-700 leading-relaxed">
          <span className="font-semibold">{dominant.animalName}:</span> {dominant[field]}
        </dd>
      )}
      {secondary && (
        <dd className="text-sm text-slate-600 leading-relaxed mt-1">
          <span className="font-semibold">{secondary.animalName}:</span> {secondary[field]}
        </dd>
      )}
    </div>
  )

  const sortedAnswers = result.answers.slice().sort((a, b) => a.questionOrder - b.questionOrder)

  return (
    <Card className="behavioral-profile-card">
      <div className="flex items-center justify-between mb-3 print:hidden">
        <h3 className="font-semibold text-slate-900">Perfil Comportamental</h3>
        <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-600" title="Exportar PDF">
          <Printer className="h-4 w-4" />
        </button>
      </div>

      <div className="print:hidden">
        <div className="flex gap-1 mb-4 flex-wrap">
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
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="pct"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={76}
                  paddingAngle={2}
                >
                  {categoryData.map((c) => (
                    <Cell key={c.code} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3">
              {categoryData.map((c) => (
                <div key={c.code} className="flex items-center gap-2 text-sm">
                  <img
                    src={ANIMAL_PHOTOS[c.code]}
                    alt={c.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
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
                <div className="flex items-center gap-2.5">
                  <img
                    src={ANIMAL_PHOTOS[dominant.code]}
                    alt={dominant.animalName}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                    style={{ boxShadow: `0 0 0 2px ${dominant.color}` }}
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold">{dominant.animalName}</span> — {dominant.tagline}
                  </span>
                </div>
              )}
              {secondary && (
                <div className="flex items-center gap-2.5">
                  <img
                    src={ANIMAL_PHOTOS[secondary.code]}
                    alt={secondary.animalName}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                    style={{ boxShadow: `0 0 0 2px ${secondary.color}` }}
                  />
                  <span className="text-sm text-slate-600">
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
                const roles = quadrant.categories
                  .map((code) => profileByCode.get(code)?.brainRole ?? code)
                  .join(' + ')
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
            {sortedAnswers.map((answer) => (
              <li key={answer.id} className="pb-3 border-b border-slate-100 last:border-0">
                <p className="text-xs text-slate-400 mb-0.5">
                  {answer.questionOrder}. {answer.questionText}
                </p>
                <p className="text-slate-700">{answer.answerText}</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="hidden print:block text-slate-800">
        <style>{'@media print { @page { size: A4; margin: 16mm; } }'}</style>

        <header className="flex items-start justify-between border-b-2 border-slate-800 pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Relatório de Perfil Comportamental</h1>
            <p className="text-slate-500 mt-1">{candidateName}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p className="font-semibold text-slate-700">GEHFER</p>
            <p>{new Date(result.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-bold mb-4">Perfil Comportamental</h2>

          <div className="grid grid-cols-[220px_1fr] gap-8 mb-6 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="pct"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {categoryData.map((c) => (
                    <Cell key={c.code} fill={c.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3">
              {categoryData.map((c) => (
                <div key={c.code} className="flex items-center gap-2 text-sm">
                  <img
                    src={ANIMAL_PHOTOS[c.code]}
                    alt={c.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ boxShadow: `0 0 0 2px ${c.color}` }}
                  />
                  <span>
                    {c.name} <span className="text-slate-400">{c.pct.toFixed(0)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-700 mb-2">Características principais</h3>
          <div className="flex gap-6 mb-6">
            {dominant && (
              <div className="flex items-center gap-3">
                <img
                  src={ANIMAL_PHOTOS[dominant.code]}
                  alt={dominant.animalName}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                  style={{ boxShadow: `0 0 0 3px ${dominant.color}` }}
                />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Dominante</p>
                  <p className="font-bold">{dominant.animalName}</p>
                  <p className="text-sm text-slate-500">{dominant.tagline}</p>
                </div>
              </div>
            )}
            {secondary && (
              <div className="flex items-center gap-3">
                <img
                  src={ANIMAL_PHOTOS[secondary.code]}
                  alt={secondary.animalName}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                  style={{ boxShadow: `0 0 0 3px ${secondary.color}` }}
                />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide">Complementar</p>
                  <p className="font-bold">{secondary.animalName}</p>
                  <p className="text-sm text-slate-500">{secondary.tagline}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-8">
            {printTraitRow('Traços comportamentais', 'behavioralTraits')}
            {printTraitRow('Pontos fortes', 'strengths')}
            {printTraitRow('Pontos de melhoria', 'improvementPoints')}
            {printTraitRow('Motivações', 'motivations')}
            {printTraitRow('Valores', 'values')}
          </div>
        </section>

        <section style={{ breakBefore: 'page' }} className="pt-8">
          <h2 className="text-lg font-bold mb-4">Preferência Cerebral</h2>

          <div className="flex gap-10 items-start">
            <div className="w-72 shrink-0">
              <BrainQuadrantDiagram regions={diagramRegions} />
            </div>

            <div className="flex-1 space-y-4">
              {quadrantData.map((q) => {
                const quadrant = quadrantByCode.get(q.code)
                if (!quadrant) return null
                const roles = quadrant.categories
                  .map((code) => profileByCode.get(code)?.brainRole ?? code)
                  .join(' + ')
                return (
                  <div key={q.code} className="pb-4 border-b border-slate-200 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-700">
                        {quadrant.brainRegion} <span className="text-slate-400 font-normal">({roles})</span>
                      </span>
                      <span className="text-sm font-bold text-slate-600">{q.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-slate-700" style={{ width: `${q.pct}%` }} />
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{quadrant.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {quadrant.keywords.map((word) => (
                        <span key={word} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section style={{ breakBefore: 'page' }} className="pt-8">
          <h2 className="text-lg font-bold mb-4">Respostas do questionário</h2>
          <ol className="grid grid-cols-2 gap-x-8 gap-y-3">
            {sortedAnswers.map((answer) => (
              <li key={answer.id} className="text-sm pb-2 border-b border-slate-100">
                <p className="text-slate-400 text-xs mb-0.5">
                  {answer.questionOrder}. {answer.questionText}
                </p>
                <p className="text-slate-700">{answer.answerText}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Card>
  )
}
