import { useEffect, useState, FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronRight, CheckCircle2 } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useCreatePreRegistration, PreRegistrationPayload } from '../../hooks/usePreRegistration'
import { useBehavioralQuestions, useSubmitBehavioralResult, CategoryCode } from '../../hooks/useBehavioralProfile'

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
  const [step, setStep] = useState<'form' | 'quiz' | 'done'>('form')
  const [preRegistrationId, setPreRegistrationId] = useState<string | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, CategoryCode>>({})
  const [alternativeOrder, setAlternativeOrder] = useState<Record<number, CategoryCode[]>>({})

  const createPreRegistration = useCreatePreRegistration()
  const { data: questions } = useBehavioralQuestions()
  const submitResult = useSubmitBehavioralResult()

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
      setStep('quiz')
    } catch {
      toast.error('Erro ao enviar pré-cadastro. Verifique os dados e tente novamente.')
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
      <div className="w-full max-w-lg">
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
                      Avançar para o questionário
                    </Button>
                  </form>
                </>
              )}

              {step === 'quiz' && currentQuestion && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-medium text-slate-500">
                        Questão {questionIndex + 1} de {questions?.length}
                      </h2>
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
