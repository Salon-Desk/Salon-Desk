export interface PayloadBlockProps {
  title: string
  hint: string
  tone: 'sky' | 'emerald'
  payload: unknown
}

export function PayloadBlock({ title, hint, tone, payload }: PayloadBlockProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`font-bold text-xs ${tone === 'sky' ? 'text-sky-700' : 'text-emerald-700'}`}
        >
          {title}
        </span>
        <span className="font-mono text-[11px] text-slate-500">{hint}</span>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-[11px] text-slate-100">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  )
}
