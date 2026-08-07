import { Card } from '../../ui/Card'
import { DigitalResume } from '../../../hooks/useResumes'

const EDUCATION_LEVEL_LABELS: Record<string, string> = {
  ENSINO_MEDIO: 'Ensino médio',
  TECNICO: 'Técnico',
  SUPERIOR: 'Superior',
  POS_GRADUACAO: 'Pós-graduação',
  MESTRADO: 'Mestrado',
  DOUTORADO: 'Doutorado',
}

const EDUCATION_STATUS_LABELS: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  TRANCADO: 'Trancado',
}

const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  BASICO: 'Básico',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
  FLUENTE: 'Fluente',
}

function formatMonth(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

interface DigitalResumeCardProps {
  resume: DigitalResume
}

export function DigitalResumeCard({ resume }: DigitalResumeCardProps) {
  const isEmpty =
    !resume.desiredJob &&
    resume.experiences.length === 0 &&
    resume.educations.length === 0 &&
    resume.languages.length === 0 &&
    resume.skills.length === 0

  return (
    <Card className="print:hidden">
      <h3 className="font-semibold text-slate-900 mb-3">Currículo Digital</h3>

      {isEmpty ? (
        <p className="text-sm text-slate-500">O candidato não preencheu nenhuma seção do currículo digital.</p>
      ) : (
        <div className="space-y-4 text-sm">
          {resume.desiredJob && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Vaga de interesse</h4>
              <p className="text-slate-700">
                {resume.desiredJob.title} <span className="text-slate-400">— {resume.desiredJob.department}</span>
              </p>
            </div>
          )}

          {resume.experiences.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Experiência profissional
              </h4>
              <div className="space-y-3">
                {resume.experiences.map((exp) => (
                  <div key={exp.id}>
                    <p className="font-medium text-slate-700">
                      {exp.role} <span className="text-slate-400 font-normal">— {exp.company}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatMonth(exp.startDate)} — {exp.current ? 'Atual' : formatMonth(exp.endDate)}
                    </p>
                    {exp.description && (
                      <p className="text-slate-600 mt-0.5 whitespace-pre-line">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.educations.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Formação acadêmica
              </h4>
              <div className="space-y-3">
                {resume.educations.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-medium text-slate-700">
                      {edu.course} <span className="text-slate-400 font-normal">— {edu.institution}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {EDUCATION_LEVEL_LABELS[edu.level] ?? edu.level} · {EDUCATION_STATUS_LABELS[edu.status] ?? edu.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.languages.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Idiomas</h4>
              <div className="flex flex-wrap gap-2">
                {resume.languages.map((lang) => (
                  <span key={lang.id} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                    {lang.language} — {LANGUAGE_LEVEL_LABELS[lang.level] ?? lang.level}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resume.skills.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Habilidades</h4>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
