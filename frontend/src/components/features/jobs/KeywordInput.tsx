import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

export interface Keyword {
  keyword: string
  type: 'REQUIRED' | 'DESIRED'
}

interface KeywordInputProps {
  value: Keyword[]
  onChange: (keywords: Keyword[]) => void
}

export function KeywordInput({ value, onChange }: KeywordInputProps) {
  const [requiredInput, setRequiredInput] = useState('')
  const [desiredInput, setDesiredInput] = useState('')

  const add = (keyword: string, type: 'REQUIRED' | 'DESIRED') => {
    const trimmed = keyword.trim()
    if (!trimmed || value.some((k) => k.keyword.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...value, { keyword: trimmed, type }])
  }

  const remove = (keyword: string) => onChange(value.filter((k) => k.keyword !== keyword))

  const handleKey = (e: KeyboardEvent<HTMLInputElement>, type: 'REQUIRED' | 'DESIRED') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = type === 'REQUIRED' ? requiredInput : desiredInput
      add(input, type)
      if (type === 'REQUIRED') setRequiredInput('')
      else setDesiredInput('')
    }
  }

  return (
    <div className="space-y-4">
      {(['REQUIRED', 'DESIRED'] as const).map((type) => (
        <div key={type}>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            {type === 'REQUIRED' ? 'Palavras-chave obrigatórias' : 'Palavras-chave desejáveis'}
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-slate-200 rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary">
            {value.filter((k) => k.type === type).map((k) => (
              <span
                key={k.keyword}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  type === 'REQUIRED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {k.keyword}
                <button type="button" onClick={() => remove(k.keyword)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={type === 'REQUIRED' ? requiredInput : desiredInput}
              onChange={(e) => type === 'REQUIRED' ? setRequiredInput(e.target.value) : setDesiredInput(e.target.value)}
              onKeyDown={(e) => handleKey(e, type)}
              placeholder="Digite e pressione Enter"
              className="flex-1 min-w-[160px] bg-transparent text-sm outline-none placeholder-slate-400 px-1"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
