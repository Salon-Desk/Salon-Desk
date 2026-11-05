'use client'

import React from 'react'

import { cn } from '@/lib/utils'

function renderInlineFormatting(text: string): React.ReactNode {
  // Matches **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-inherit">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 3 && !part.startsWith('**')) {
      return (
        <em key={i} className="italic text-inherit">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 3) {
      return (
        <code
          key={i}
          className="rounded bg-slate-200/60 px-1 py-0.5 font-mono text-[11px] text-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}

/**
 * Lightweight formatting renderer for bot markdown answers (bold, bullet/number lists, paragraphs).
 */
export function RichText({ content, className }: { content: string; className?: string }) {
  if (!content) return null
  const blocks = content.split(/\n{2,}/)

  return (
    <div className={cn('space-y-1.5', className)}>
      {blocks.map((block, blockIdx) => {
        const lines = block.split('\n').filter((l) => l.trim().length > 0)
        if (lines.length === 0) return null

        const isBulletList = lines.every((line) => /^[-*•+]\s+/.test(line.trim()))
        if (isBulletList) {
          return (
            <ul key={blockIdx} className="list-disc space-y-1 pl-4">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^[-*•+]\s+/, '')
                return <li key={lineIdx}>{renderInlineFormatting(itemText)}</li>
              })}
            </ul>
          )
        }

        const isNumberedList = lines.every((line) => /^\d+[\.)]\s+/.test(line.trim()))
        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="list-decimal space-y-1 pl-4">
              {lines.map((line, lineIdx) => {
                const itemText = line.trim().replace(/^\d+[\.)]\s+/, '')
                return <li key={lineIdx}>{renderInlineFormatting(itemText)}</li>
              })}
            </ol>
          )
        }

        return (
          <p key={blockIdx} className="leading-relaxed">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderInlineFormatting(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}
