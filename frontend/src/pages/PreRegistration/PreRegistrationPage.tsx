import { useEffect, useState, FormEvent, Dispatch, SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronRight, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import {
  useCreatePreRegistration,
  usePreRegistrationStatus,
  PreRegistrationPayload,
} from '../../hooks/usePreRegistration'
import { useBehavioralQuestions, useSubmitBehavioralResult, CategoryCode } from '../../hooks/useBehavioralProfile'
import {
  useCreateDigitalResume,
  WorkExperiencePayload,
  EducationPayload,
  LanguageSkillPayload,
  EducationLevel,
  EducationStatus,
  LanguageLevel,
} from '../../hooks/useDigitalResume'
import { usePublicJobs } from '../../hooks/useJobs'

const QUIZ_SECONDS = 15 * 60

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  ENSINO_MEDIO: 'Ensino médio',
  TECNICO: 'Técnico',
  SUPERIOR: 'Superior',
  POS_GRADUACAO: 'Pós-graduação',
  MESTRADO: 'Mestrado',
  DOUTORADO: 'Doutorado',
}

const EDUCATION_STATUS_LABELS: Record<EducationStatus, string> = {
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  TRANCADO: 'Trancado',
}

const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  BASICO: 'Básico',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
  FLUENTE: 'Fluente',
}

function emptyExperience(): WorkExperiencePayload {
  return { company: '', role: '', startDate: '', endDate: '', current: false, description: '' }
}

function emptyEducation(): EducationPayload {
  return { institution: '', course: '', level: 'SUPERIOR', status: 'EM_ANDAMENTO', startDate: '', endDate: '' }
}

function emptyLanguage(): LanguageSkillPayload {
  return { language: '', level: 'BASICO' }
}

function updateAt<T>(setter: Dispatch<SetStateAction<T[]>>, index: number, patch: Partial<T>) {
  setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
}

function removeAt<T>(setter: Dispatch<SetStateAction<T[]>>, index: number) {
  setter((prev) => prev.filter((_, i) => i !== index))
}

function emptyForm(candidateId: string): PreRegistrationPayload {
  return {
    candidateId,
    name: '',
    email: '',
    birthPlace: '',
    birthDate: '',
    rg: '',
    cpf: '',
    fatherName: '',
    motherName: '',
  }
}

const CATEGORY_ORDER: CategoryCode[] = ['E', 'C', 'A', 'V']

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export default function PreRegistrationPage() {
  const [searchParams] = useSearchParams()
  const candidateId = searchParams.get('candidateId') ?? ''
  const [form, setForm] = useState<PreRegistrationPayload>(() => emptyForm(candidateId))
  const [step, setStep] = useState<'form' | 'resume' | 'quiz' | 'done'>('form')
  const [preRegistrationId, setPreRegistrationId] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, CategoryCode>>({})
  const [alternativeOrder, setAlternativeOrder] = useState<Record<number, CategoryCode[]>>({})
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_SECONDS)

  const [experiences, setExperiences] = useState<WorkExperiencePayload[]>([])
  const [educations, setEducations] = useState<EducationPayload[]>([])
  const [languages, setLanguages] = useState<LanguageSkillPayload[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [resumeDataSeeded, setResumeDataSeeded] = useState(false)
  const [desiredJobId, setDesiredJobId] = useState('')

  const createPreRegistration = useCreatePreRegistration()
  const { data: status, isLoading: statusLoading } = usePreRegistrationStatus(candidateId)
  const createDigitalResume = useCreateDigitalResume()
  const { data: publicJobs } = usePublicJobs()
  const { data: questions } = useBehavioralQuestions()
  const submitResult = useSubmitBehavioralResult()

  useEffect(() => {
    if (resumeDataSeeded || !status) return
    const hasData =
      status.extractedSkills?.length ||
      status.extractedExperiences?.length ||
      status.extractedEducations?.length ||
      status.extractedLanguages?.length
    if (!hasData) return

    if (status.extractedSkills?.length) setSkills(status.extractedSkills)
    if (status.extractedExperiences?.length) setExperiences(status.extractedExperiences)
    if (status.extractedEducations?.length) setEducations(status.extractedEducations)
    if (status.extractedLanguages?.length) setLanguages(status.extractedLanguages)
    setResumeDataSeeded(true)
  }, [status, resumeDataSeeded])

  useEffect(() => {
    if (step !== 'quiz') return
    setSecondsLeft(QUIZ_SECONDS)
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [step])

  useEffect(() => {
    if (step !== 'quiz' || secondsLeft !== 0) return
    toast.error('Tempo esgotado! O questionário foi reiniciado.')
    setAnswers({})
    setQuestionIndex(0)
    setSecondsLeft(QUIZ_SECONDS)
  }, [secondsLeft, step])

  useEffect(() => {
    if (!questions || Object.keys(alternativeOrder).length > 0) return
    const order: Record<number, CategoryCode[]> = {}
    questions.forEach((q) => {
      order[q.order] = shuffle(CATEGORY_ORDER)
    })
    setAlternativeOrder(order)
  }, [questions, alternativeOrder])

  const update = (field: keyof PreRegistrationPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (onlyDigits(form.cpf).length !== 11) {
      toast.error('CPF inválido — deve conter 11 dígitos')
      return
    }

    try {
      const res = await createPreRegistration.mutateAsync(form)
      setPreRegistrationId(res.data.data.id)
      setStep('resume')
    } catch {
      toast.error('Erro ao enviar pré-cadastro. Verifique os dados e tente novamente.')
    }
  }

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value) return
    setSkills((prev) => [...prev, value])
    setSkillInput('')
  }

  const removeSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index))
  }

  const handleResumeSubmit = async () => {
    if (!preRegistrationId) return

    try {
      await createDigitalResume.mutateAsync({
        preRegistrationId,
        skills,
        experiences: experiences.filter((e) => e.company.trim() && e.role.trim() && e.startDate),
        educations: educations.filter((e) => e.institution.trim() && e.course.trim()),
        languages: languages.filter((l) => l.language.trim()),
        desiredJobId: desiredJobId || undefined,
      })
      setStep('quiz')
    } catch {
      toast.error('Erro ao enviar o currículo digital. Tente novamente.')
    }
  }

  const selectAlternative = (order: number, category: CategoryCode) => {
    setAnswers((prev) => ({ ...prev, [order]: category }))
  }

  const handleNext = async () => {
    if (!questions) return

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1)
      return
    }

    if (!preRegistrationId) return

    try {
      await submitResult.mutateAsync({
        preRegistrationId,
        answers: questions.map((q) => ({ questionOrder: q.order, categoryCode: answers[q.order] })),
      })
      setStep('done')
    } catch {
      toast.error('Erro ao enviar o questionário. Tente novamente.')
    }
  }

  const currentQuestion = questions?.[questionIndex]
  const currentAnswer = currentQuestion ? answers[currentQuestion.order] : undefined
  const isLastQuestion = questions ? questionIndex === questions.length - 1 : false

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className={`w-full ${step === 'resume' ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <ChevronRight className="h-6 w-6 text-white" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">GEHFER</span>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {!candidateId ? (
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Link inválido</h2>
              <p className="text-slate-500 text-sm">
                Este link está incompleto. Solicite o link correto ao RH responsável pelo seu processo seletivo.
              </p>
            </div>
          ) : statusLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : status?.completed ? (
            <div className="text-center py-4">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Teste já realizado</h2>
              <p className="text-slate-500 text-sm">
                Identificamos que você já concluiu o pré-cadastro e o questionário. Se acredita que isso é um
                engano, entre em contato com o RH responsável pelo seu processo seletivo.
              </p>
            </div>
          ) : (
            <>
              {step === 'form' && (
                <>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">Pré-cadastro de candidato</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Preencha seus dados abaixo para dar continuidade ao processo seletivo.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nome completo" value={form.name} onChange={update('name')} required />
                    <Input label="E-mail" type="email" value={form.email} onChange={update('email')} required />
                    <Input
                      label="Naturalidade (cidade de nascimento)"
                      value={form.birthPlace}
                      onChange={update('birthPlace')}
                      required
                    />
                    <Input
                      label="Data de nascimento"
                      type="date"
                      value={form.birthDate}
                      onChange={update('birthDate')}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="RG" value={form.rg} onChange={update('rg')} required />
                      <Input
                        label="CPF"
                        value={form.cpf}
                        onChange={update('cpf')}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    <Input label="Nome do pai" value={form.fatherName} onChange={update('fatherName')} required />
                    <Input label="Nome da mãe" value={form.motherName} onChange={update('motherName')} required />

                    <Button type="submit" className="w-full" loading={createPreRegistration.isPending}>
                      Avançar para o currículo digital
                    </Button>
                  </form>
                </>
              )}

              {step === 'resume' && (
                <>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">Currículo digital</h2>
                  <p className="text-slate-500 text-sm mb-6">
                    Preencha sua experiência, formação e habilidades. Pode deixar em branco o que não tiver.
                    {resumeDataSeeded && ' Já preenchemos alguns campos com base no currículo que você enviou — confira e complete o que faltar.'}
                  </p>

                  <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
                    <section>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Vaga de interesse</h3>
                      <select
                        value={desiredJobId}
                        onChange={(e) => setDesiredJobId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Selecione a vaga que mais te interessa</option>
                        {publicJobs?.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} — {job.department}
                          </option>
                        ))}
                      </select>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">Experiência profissional</h3>
                        <button
                          type="button"
                          onClick={() => setExperiences((prev) => [...prev, emptyExperience()])}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="space-y-3">
                        {experiences.map((exp, i) => (
                          <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => removeAt(setExperiences, i)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <Input
                              label="Empresa"
                              value={exp.company}
                              onChange={(e) => updateAt(setExperiences, i, { company: e.target.value })}
                            />
                            <Input
                              label="Cargo"
                              value={exp.role}
                              onChange={(e) => updateAt(setExperiences, i, { role: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                label="Início"
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateAt(setExperiences, i, { startDate: e.target.value })}
                              />
                              <Input
                                label="Fim"
                                type="month"
                                value={exp.endDate ?? ''}
                                disabled={!!exp.current}
                                onChange={(e) => updateAt(setExperiences, i, { endDate: e.target.value })}
                              />
                            </div>
                            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!exp.current}
                                onChange={(e) => updateAt(setExperiences, i, { current: e.target.checked, endDate: '' })}
                                className="rounded border-slate-300"
                              />
                              Emprego atual
                            </label>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium text-slate-700">Descrição das atividades</label>
                              <textarea
                                value={exp.description ?? ''}
                                onChange={(e) => updateAt(setExperiences, i, { description: e.target.value })}
                                rows={2}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                          </div>
                        ))}
                        {experiences.length === 0 && (
                          <p className="text-xs text-slate-400">Nenhuma experiência adicionada.</p>
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">Formação acadêmica</h3>
                        <button
                          type="button"
                          onClick={() => setEducations((prev) => [...prev, emptyEducation()])}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="space-y-3">
                        {educations.map((edu, i) => (
                          <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => removeAt(setEducations, i)}
                              className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <Input
                              label="Instituição"
                              value={edu.institution}
                              onChange={(e) => updateAt(setEducations, i, { institution: e.target.value })}
                            />
                            <Input
                              label="Curso"
                              value={edu.course}
                              onChange={(e) => updateAt(setEducations, i, { course: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Nível</label>
                                <select
                                  value={edu.level}
                                  onChange={(e) =>
                                    updateAt(setEducations, i, { level: e.target.value as EducationLevel })
                                  }
                                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                >
                                  {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                  value={edu.status}
                                  onChange={(e) =>
                                    updateAt(setEducations, i, { status: e.target.value as EducationStatus })
                                  }
                                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                                >
                                  {Object.entries(EDUCATION_STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                label="Início"
                                type="month"
                                value={edu.startDate ?? ''}
                                onChange={(e) => updateAt(setEducations, i, { startDate: e.target.value })}
                              />
                              <Input
                                label="Fim"
                                type="month"
                                value={edu.endDate ?? ''}
                                onChange={(e) => updateAt(setEducations, i, { endDate: e.target.value })}
                              />
                            </div>
                          </div>
                        ))}
                        {educations.length === 0 && (
                          <p className="text-xs text-slate-400">Nenhuma formação adicionada.</p>
                        )}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-700">Idiomas</h3>
                        <button
                          type="button"
                          onClick={() => setLanguages((prev) => [...prev, emptyLanguage()])}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          + Adicionar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {languages.map((lang, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              value={lang.language}
                              placeholder="Idioma"
                              onChange={(e) => updateAt(setLanguages, i, { language: e.target.value })}
                              className="flex-1"
                            />
                            <select
                              value={lang.level}
                              onChange={(e) => updateAt(setLanguages, i, { level: e.target.value as LanguageLevel })}
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                            >
                              {Object.entries(LANGUAGE_LEVEL_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeAt(setLanguages, i)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {languages.length === 0 && <p className="text-xs text-slate-400">Nenhum idioma adicionado.</p>}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-semibold text-slate-700 mb-2">Habilidades</h3>
                      <div className="flex items-center gap-2">
                        <input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addSkill()
                            }
                          }}
                          placeholder="Ex: Excel, Liderança, Inglês técnico..."
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={addSkill}>
                          Adicionar
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                          >
                            {skill}
                            <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </section>
                  </div>

                  <Button
                    className="w-full mt-6"
                    loading={createDigitalResume.isPending}
                    onClick={handleResumeSubmit}
                  >
                    Continuar para o questionário
                  </Button>
                </>
              )}

              {step === 'quiz' && currentQuestion && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-medium text-slate-500">
                        Questão {questionIndex + 1} de {questions?.length}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          secondsLeft <= 60 ? 'text-red-500' : 'text-slate-400'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(secondsLeft)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${((questionIndex + 1) / (questions?.length ?? 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{currentQuestion.text}</h3>

                  <div className="space-y-2 mb-6">
                    {(alternativeOrder[currentQuestion.order] ?? CATEGORY_ORDER).map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => selectAlternative(currentQuestion.order, category)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          currentAnswer === category
                            ? 'border-primary bg-primary/5 text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {currentQuestion.alternatives[category]}
                      </button>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!currentAnswer}
                    loading={submitResult.isPending}
                    onClick={handleNext}
                  >
                    {isLastQuestion ? 'Finalizar' : 'Próxima'}
                  </Button>
                </>
              )}

              {step === 'done' && (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">Cadastro enviado!</h2>
                  <p className="text-slate-500 text-sm">
                    Recebemos seus dados e suas respostas. Aguarde o contato da nossa equipe.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
